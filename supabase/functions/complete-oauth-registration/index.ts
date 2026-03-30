import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the user's JWT
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { role } = await req.json();
    if (!role || !["landlord", "tenant"].includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role. Must be 'landlord' or 'tenant'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Check if profile already exists (idempotent)
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingProfile) {
      return new Response(JSON.stringify({ success: true, message: "Profile already exists" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";
    const email = user.email || "";
    const phone = user.user_metadata?.phone || "";

    // Create profile
    const { error: profileError } = await admin.from("profiles").insert({
      user_id: user.id,
      full_name: fullName,
      email,
      phone,
    });
    if (profileError) {
      console.error("Profile insert error:", profileError);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user role
    const { error: roleError } = await admin.from("user_roles").insert({
      user_id: user.id,
      role,
    });
    if (roleError) {
      console.error("Role insert error:", roleError);
      return new Response(JSON.stringify({ error: roleError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If tenant, create tenant record
    if (role === "tenant") {
      const { error: tenantError } = await admin.from("tenants").insert({
        user_id: user.id,
        owner_id: user.id,
        full_name: fullName,
        phone,
        status: "active",
      });
      if (tenantError) {
        console.error("Tenant insert error:", tenantError);
        return new Response(JSON.stringify({ error: tenantError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
