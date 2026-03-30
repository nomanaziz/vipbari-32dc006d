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

    // Check caller is admin
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // Search landlords by phone or name
    if (action === "search_landlords") {
      const { query } = body;
      if (!query || query.length < 2) {
        return new Response(JSON.stringify({ error: "Query too short" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: landlords } = await adminClient
        .from("profiles")
        .select("user_id, full_name, phone")
        .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(10);

      // Filter to only landlord role users
      const landlordIds = [];
      for (const l of landlords || []) {
        const { data: role } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", l.user_id)
          .eq("role", "landlord")
          .maybeSingle();
        if (role) landlordIds.push(l);
      }

      return new Response(JSON.stringify({ landlords: landlordIds }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reassign property to another landlord
    if (action === "reassign_property") {
      const { property_id, new_owner_id, include_rooms, include_tenants } = body;
      if (!property_id || !new_owner_id) {
        return new Response(JSON.stringify({ error: "property_id and new_owner_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get current property
      const { data: prop } = await adminClient
        .from("properties")
        .select("id, owner_id, name")
        .eq("id", property_id)
        .single();

      if (!prop) {
        return new Response(JSON.stringify({ error: "Property not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const oldOwnerId = prop.owner_id;

      // Update property owner
      await adminClient.from("properties").update({ owner_id: new_owner_id }).eq("id", property_id);

      // Update related rooms' tenants and assets if requested
      if (include_tenants) {
        // Get rooms of this property
        const { data: rooms } = await adminClient
          .from("rooms")
          .select("id, tenant_id")
          .eq("property_id", property_id);

        const roomIds = (rooms || []).map(r => r.id);
        const tenantIds = (rooms || []).filter(r => r.tenant_id).map(r => r.tenant_id!);

        // Reassign tenants
        if (tenantIds.length > 0) {
          for (const tid of tenantIds) {
            await adminClient.from("tenants").update({ owner_id: new_owner_id }).eq("id", tid);
          }
        }

        // Reassign bills for these tenants
        if (tenantIds.length > 0) {
          for (const tid of tenantIds) {
            await adminClient.from("bills").update({ owner_id: new_owner_id }).eq("tenant_id", tid).eq("owner_id", oldOwnerId);
          }
        }

        // Reassign meters
        if (roomIds.length > 0) {
          for (const rid of roomIds) {
            await adminClient.from("meters").update({ owner_id: new_owner_id }).eq("room_id", rid).eq("owner_id", oldOwnerId);
          }
        }

        // Reassign garages
        await adminClient.from("garages").update({ owner_id: new_owner_id }).eq("property_id", property_id).eq("owner_id", oldOwnerId);
      }

      // Record transfer history
      await adminClient.from("property_transfers").insert({
        property_id,
        from_user_id: oldOwnerId,
        to_user_id: new_owner_id,
        transfer_scope: "property",
        status: "completed",
        include_tenants: include_tenants ?? true,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reassign a single room to another landlord (creates new property shell)
    if (action === "reassign_room") {
      const { room_id, new_owner_id, include_tenant } = body;
      if (!room_id || !new_owner_id) {
        return new Response(JSON.stringify({ error: "room_id and new_owner_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: room } = await adminClient
        .from("rooms")
        .select("*, properties(id, name, owner_id)")
        .eq("id", room_id)
        .single();

      if (!room) {
        return new Response(JSON.stringify({ error: "Room not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const oldOwnerId = (room as any).properties?.owner_id;
      const propName = (room as any).properties?.name || "Property";

      // Create a new property shell for buyer
      const { data: newProp } = await adminClient
        .from("properties")
        .insert({
          name: `${propName} (${room.room_number})`,
          owner_id: new_owner_id,
          total_rooms: 1,
        })
        .select("id")
        .single();

      if (!newProp) {
        return new Response(JSON.stringify({ error: "Failed to create property" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Move room to new property
      await adminClient.from("rooms").update({ property_id: newProp.id }).eq("id", room_id);

      // Move room images
      await adminClient.from("room_images").update({ room_id: room_id }).eq("room_id", room_id);

      // Reassign tenant if requested
      if (include_tenant && room.tenant_id) {
        await adminClient.from("tenants").update({ owner_id: new_owner_id }).eq("id", room.tenant_id);
        await adminClient.from("bills").update({ owner_id: new_owner_id }).eq("tenant_id", room.tenant_id).eq("owner_id", oldOwnerId);
      }

      // Reassign meters for room
      await adminClient.from("meters").update({ owner_id: new_owner_id }).eq("room_id", room_id);

      // Reassign garages for room
      await adminClient.from("garages").update({ owner_id: new_owner_id }).eq("room_id", room_id);

      // Record transfer
      await adminClient.from("property_transfers").insert({
        property_id: (room as any).properties?.id,
        room_id,
        new_property_id: newProp.id,
        from_user_id: oldOwnerId,
        to_user_id: new_owner_id,
        transfer_scope: "unit",
        status: "completed",
        include_tenants: include_tenant ?? true,
      });

      // Update old property room count
      const { count } = await adminClient
        .from("rooms")
        .select("id", { count: "exact", head: true })
        .eq("property_id", (room as any).properties?.id);
      await adminClient.from("properties").update({ total_rooms: count || 0 }).eq("id", (room as any).properties?.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reassign tenant to another landlord
    if (action === "reassign_tenant") {
      const { tenant_id, new_owner_id } = body;
      if (!tenant_id || !new_owner_id) {
        return new Response(JSON.stringify({ error: "tenant_id and new_owner_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await adminClient.from("tenants").update({ owner_id: new_owner_id }).eq("id", tenant_id);

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
