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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is a landlord
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check caller is a landlord
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "landlord")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Only landlords can link tenants" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, phone, tenant_id, room_id } = await req.json();

    // Action: search - find unassigned tenants by phone
    if (action === "search") {
      if (!phone || phone.length < 4) {
        return new Response(JSON.stringify({ error: "Phone number too short" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: tenants } = await adminClient
        .from("tenants")
        .select("id, full_name, phone, user_id, owner_id")
        .ilike("phone", `%${phone}%`)
        .limit(10);

      // Filter to only unassigned (owner_id = user_id) tenants
      const unassigned = (tenants || []).filter(
        (t: any) => t.user_id && t.owner_id === t.user_id
      );

      return new Response(JSON.stringify({ tenants: unassigned }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: link - assign tenant to this landlord
    if (action === "link") {
      if (!tenant_id) {
        return new Response(JSON.stringify({ error: "tenant_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify tenant is unassigned
      const { data: tenant } = await adminClient
        .from("tenants")
        .select("id, user_id, owner_id")
        .eq("id", tenant_id)
        .single();

      if (!tenant || tenant.owner_id !== tenant.user_id) {
        return new Response(JSON.stringify({ error: "Tenant is not available for linking" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update owner_id and optionally room_id
      const updateData: any = { owner_id: user.id };
      if (room_id) {
        updateData.room_id = room_id;
      }

      const { error: updateError } = await adminClient
        .from("tenants")
        .update(updateData)
        .eq("id", tenant_id);

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If room assigned, mark room as occupied
      if (room_id) {
        await adminClient
          .from("rooms")
          .update({ status: "occupied", tenant_id: tenant_id })
          .eq("id", room_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
