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

    // Verify caller is admin
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

    const { user_id } = await req.json();
    if (!user_id) throw new Error("Missing user_id");

    // Don't allow self-delete
    if (user_id === caller.id) throw new Error("Cannot delete yourself");

    const { data: tenantRows } = await supabaseAdmin
      .from("tenants")
      .select("id, room_id")
      .eq("user_id", user_id);

    const tenantIds = (tenantRows || []).map((tenant) => tenant.id);
    const roomIds = (tenantRows || []).map((tenant) => tenant.room_id).filter(Boolean);

    if (roomIds.length > 0) {
      await supabaseAdmin
        .from("rooms")
        .update({ status: "vacant", tenant_id: null })
        .in("id", roomIds);
    }

    if (tenantIds.length > 0) {
      await supabaseAdmin.from("tenant_invitations").delete().in("tenant_id", tenantIds);
    }

    await supabaseAdmin.from("tenant_invitations").delete().eq("tenant_user_id", user_id);
    await supabaseAdmin.from("tenant_invitations").delete().eq("landlord_id", user_id);
    await supabaseAdmin.from("tenants").delete().eq("user_id", user_id);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
    await supabaseAdmin.from("profiles").delete().eq("user_id", user_id);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
