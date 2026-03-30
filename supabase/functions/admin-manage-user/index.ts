import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (!caller) throw new Error("Invalid token");

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Not admin");

    const { action, userId, email, tempPassword } = await req.json();

    switch (action) {
      case "reset_password": {
        if (!email) throw new Error("Email required");
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email,
        });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, message: "Password reset link generated", link: data?.properties?.action_link }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "set_temp_password": {
        if (!userId || !tempPassword) throw new Error("userId and tempPassword required");
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: tempPassword,
        });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "toggle_active": {
        if (!userId) throw new Error("userId required");
        // Get current status
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("is_active")
          .eq("user_id", userId)
          .single();

        const newStatus = !profile?.is_active;

        // Update profile
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update({ is_active: newStatus })
          .eq("user_id", userId);
        if (profileError) throw profileError;

        // Ban/unban in auth
        if (!newStatus) {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: "876000h", // ~100 years
          });
        } else {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: "none",
          });
        }

        return new Response(JSON.stringify({ success: true, is_active: newStatus }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "confirm_email": {
        if (!userId) throw new Error("userId required");
        const { error: confirmErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          email_confirm: true,
        });
        if (confirmErr) throw confirmErr;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list_auth_users": {
        const { data: authData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        if (listErr) throw listErr;
        const result = authData.users.map((u) => ({
          id: u.id,
          email_confirmed_at: u.email_confirmed_at || null,
        }));
        return new Response(JSON.stringify({ users: result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "toggle_verified": {
        if (!userId) throw new Error("userId required");
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("is_verified")
          .eq("user_id", userId)
          .single();

        const newVerified = !profile?.is_verified;
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ is_verified: newVerified })
          .eq("user_id", userId);
        if (error) throw error;

        return new Response(JSON.stringify({ success: true, is_verified: newVerified }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
