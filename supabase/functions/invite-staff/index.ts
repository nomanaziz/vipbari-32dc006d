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

    // Verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (!caller) throw new Error("Invalid token");

    // Caller must be admin or landlord
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const roles = (callerRoles || []).map((r: any) => r.role);
    const isAdmin = roles.includes("admin");
    const isLandlord = roles.includes("landlord");

    if (!isAdmin && !isLandlord) throw new Error("Not authorized");

    const { email, password, full_name, phone, role, preset_id, landlord_id, staff_type } = await req.json();

    if (!password || !full_name || !role || !preset_id) {
      throw new Error("Missing required fields");
    }

    // Generate a placeholder email if not provided
    const userEmail = email || `staff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@placeholder.local`;

    // Validate: landlords can only create landlord_staff
    if (isLandlord && !isAdmin) {
      if (role !== "landlord_staff") throw new Error("Landlords can only invite landlord_staff");
      if (landlord_id !== caller.id) throw new Error("Cannot invite staff for another landlord");
    }

    // Validate: admins creating employees
    if (role === "employee" && !isAdmin) {
      throw new Error("Only admins can create employees");
    }

    // Create auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone: phone || "", email: userEmail, role },
    });

    if (createError) throw createError;

    // Create staff assignment
    const scope = role === "employee" ? "admin" : "landlord";
    const { error: assignError } = await supabaseAdmin
      .from("staff_assignments")
      .insert({
        user_id: newUser.user.id,
        assigned_by: caller.id,
        preset_id,
        scope,
        landlord_id: role === "landlord_staff" ? (landlord_id || caller.id) : null,
        staff_type: staff_type || "general",
      });

    if (assignError) throw assignError;

    return new Response(JSON.stringify({ user: newUser.user }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
