import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No auth header");

    const token = authHeader.replace("Bearer ", "");
    
    // Verify caller identity using admin client
    const { data: { user: caller }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !caller) throw new Error("Invalid token");
    
    const callerId = caller.id;

    const { staff_user_id, new_password } = await req.json();

    if (!staff_user_id || !new_password) {
      throw new Error("Missing staff_user_id or new_password");
    }

    if (new_password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Verify caller is the landlord of this staff member
    const { data: assignment } = await supabaseAdmin
      .from("staff_assignments")
      .select("id, landlord_id")
      .eq("user_id", staff_user_id)
      .eq("landlord_id", callerId)
      .maybeSingle();

    if (!assignment) {
      throw new Error("Not authorized: staff member not found under your account");
    }

    // Set the password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      staff_user_id,
      { password: new_password }
    );

    if (updateError) throw updateError;

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
