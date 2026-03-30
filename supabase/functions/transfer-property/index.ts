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
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: corsHeaders,
      });
    }
    const userId = user.id;

    const body = await req.json();
    const { listing_id, property_id, room_id, target_phone, transfer_scope, mode, include_tenants } = body;
    const transferMode = mode || "complete";

    // ===== SEARCH USER MODE =====
    if (transferMode === "search_user") {
      const { phone } = body;
      if (!phone || phone.length < 11) {
        return new Response(JSON.stringify({ error: "Invalid phone number" }), {
          status: 400, headers: corsHeaders,
        });
      }
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: profile } = await adminClient
        .from("profiles")
        .select("full_name, phone")
        .eq("phone", phone.trim())
        .limit(1)
        .single();
      if (!profile) {
        return new Response(JSON.stringify({ error: "No user found with this number" }), {
          status: 404, headers: corsHeaders,
        });
      }
      return new Response(JSON.stringify({ success: true, user: profile }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle buyer accept/reject of pending transfer
    if (transferMode === "complete_buyer" || transferMode === "reject_buyer") {
      return await handleBuyerAction(userId, body, transferMode);
    }

    if (!property_id || !target_phone || !transfer_scope || !listing_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (!["unit", "property"].includes(transfer_scope)) {
      return new Response(JSON.stringify({ error: "Invalid transfer_scope" }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Safety: if transfer_scope is "unit", room_id MUST be provided
    if (transfer_scope === "unit" && !room_id) {
      return new Response(JSON.stringify({ error: "room_id is required for unit transfers" }), {
        status: 400, headers: corsHeaders,
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify listing ownership
    const { data: listing, error: listErr } = await adminClient
      .from("sale_listings")
      .select("id, owner_id, property_id, room_id, sale_scope, status, title")
      .eq("id", listing_id)
      .single();

    if (listErr || !listing) {
      return new Response(JSON.stringify({ error: "Listing not found" }), {
        status: 404, headers: corsHeaders,
      });
    }

    if (listing.owner_id !== userId) {
      return new Response(JSON.stringify({ error: "You don't own this listing" }), {
        status: 403, headers: corsHeaders,
      });
    }

    // Verify property ownership
    const { data: property, error: propErr } = await adminClient
      .from("properties")
      .select("*")
      .eq("id", property_id)
      .single();

    if (propErr || !property) {
      return new Response(JSON.stringify({ error: "Property not found" }), {
        status: 404, headers: corsHeaders,
      });
    }

    if (property.owner_id !== userId) {
      return new Response(JSON.stringify({ error: "You don't own this property" }), {
        status: 403, headers: corsHeaders,
      });
    }

    // Find target user
    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("user_id, full_name, phone")
      .eq("phone", target_phone.trim())
      .limit(1)
      .single();

    if (!targetProfile) {
      return new Response(JSON.stringify({ error: "No user found with this phone number" }), {
        status: 404, headers: corsHeaders,
      });
    }

    if (targetProfile.user_id === userId) {
      return new Response(JSON.stringify({ error: "Cannot transfer to yourself" }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Check target is landlord
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", targetProfile.user_id)
      .eq("role", "landlord")
      .limit(1);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Target user is not a landlord" }), {
        status: 400, headers: corsHeaders,
      });
    }

    const targetUserId = targetProfile.user_id;

    // ===== INITIATE MODE: Create pending transfer record only =====
    if (transferMode === "initiate") {
      // Guard: prevent duplicate transfers for same listing
      const { data: existingTransfer } = await adminClient
        .from("property_transfers")
        .select("id, status")
        .eq("source_listing_id", listing_id)
        .in("status", ["completed", "pending"])
        .limit(1);

      if (existingTransfer && existingTransfer.length > 0) {
        const st = existingTransfer[0].status;
        return new Response(
          JSON.stringify({ error: st === "completed" ? "This listing has already been transferred" : "A transfer is already pending for this listing" }),
          { status: 400, headers: corsHeaders }
        );
      }

      await adminClient.from("property_transfers").insert({
        property_id,
        from_user_id: userId,
        to_user_id: targetUserId,
        status: "pending",
        transfer_scope,
        source_listing_id: listing_id,
        room_id: transfer_scope === "unit" ? room_id : null,
        new_property_id: null,
        include_tenants: include_tenants !== false,
      });

      // Update listing transfer status
      await adminClient.from("sale_listings").update({
        status: "sold",
        transfer_status: "pending",
      }).eq("id", listing_id);

      // Notify buyer
      await adminClient.from("notifications").insert({
        user_id: targetUserId,
        title: "Property Transfer Pending",
        body: `${listing.title} has been offered to you. Please accept or reject.`,
        type: "property_transfer",
        reference_id: listing_id,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Transfer initiated - pending buyer acceptance",
          target_name: targetProfile.full_name,
          transfer_scope,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== COMPLETE MODE: Execute actual transfer =====
    if (listing.status !== "sold") {
      return new Response(JSON.stringify({ error: "Listing must be sold first" }), {
        status: 400, headers: corsHeaders,
      });
    }

    let newPropertyId: string | null = null;

    if (transfer_scope === "unit") {
      if (!room_id) {
        return new Response(JSON.stringify({ error: "room_id is required for unit transfers" }), {
          status: 400, headers: corsHeaders,
        });
      }
      newPropertyId = await executeUnitTransfer(adminClient, userId, targetUserId, property, property_id, room_id, true);
    } else {
      await executeFullPropertyTransfer(adminClient, userId, targetUserId, property_id);
    }

    // Record transfer
    await adminClient.from("property_transfers").insert({
      property_id,
      from_user_id: userId,
      to_user_id: targetUserId,
      status: "completed",
      transfer_scope,
      source_listing_id: listing_id,
      room_id: transfer_scope === "unit" ? room_id : null,
      new_property_id: newPropertyId,
      include_tenants: true,
    });

    // Update listing transfer status
    await adminClient.from("sale_listings").update({
      transfer_status: "completed",
      transferred_at: new Date().toISOString(),
    }).eq("id", listing_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Transfer completed successfully",
        target_name: targetProfile.full_name,
        transfer_scope,
        new_property_id: newPropertyId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});

async function handleBuyerAction(userId: string, body: any, mode: string) {
  const { transfer_id } = body;
  if (!transfer_id) {
    return new Response(JSON.stringify({ error: "Missing transfer_id" }), {
      status: 400, headers: corsHeaders,
    });
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: transfer, error: tErr } = await adminClient
    .from("property_transfers")
    .select("*")
    .eq("id", transfer_id)
    .single();

  if (tErr || !transfer) {
    return new Response(JSON.stringify({ error: "Transfer not found" }), {
      status: 404, headers: corsHeaders,
    });
  }

  if (transfer.to_user_id !== userId) {
    return new Response(JSON.stringify({ error: "Not authorized" }), {
      status: 403, headers: corsHeaders,
    });
  }

  if (transfer.status !== "pending") {
    return new Response(JSON.stringify({ error: "Transfer is not pending" }), {
      status: 400, headers: corsHeaders,
    });
  }

  if (mode === "reject_buyer") {
    await adminClient.from("property_transfers").update({ status: "rejected" }).eq("id", transfer_id);
    if (transfer.source_listing_id) {
      await adminClient.from("sale_listings").update({
        status: "active",
        transfer_status: "pending",
      }).eq("id", transfer.source_listing_id);
    }

    await adminClient.from("notifications").insert({
      user_id: transfer.from_user_id,
      title: "Transfer Rejected",
      body: "The buyer has rejected the property transfer.",
      type: "property_transfer",
      reference_id: transfer.source_listing_id,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Transfer rejected" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // complete_buyer: execute actual transfer
  const { data: property } = await adminClient
    .from("properties")
    .select("*")
    .eq("id", transfer.property_id)
    .single();

  if (!property) {
    return new Response(JSON.stringify({ error: "Property not found" }), {
      status: 404, headers: corsHeaders,
    });
  }

  let newPropertyId: string | null = null;
  const includeTenants = transfer.include_tenants !== false;

  if (transfer.transfer_scope === "unit") {
    if (!transfer.room_id) {
      return new Response(JSON.stringify({ error: "Unit transfer missing room_id - cannot proceed" }), {
        status: 400, headers: corsHeaders,
      });
    }
    newPropertyId = await executeUnitTransfer(
      adminClient, transfer.from_user_id, userId, property, transfer.property_id, transfer.room_id, includeTenants
    );
  } else if (transfer.transfer_scope === "property") {
    await executeFullPropertyTransfer(adminClient, transfer.from_user_id, userId, transfer.property_id);
  } else {
    return new Response(JSON.stringify({ error: "Unknown transfer_scope: " + transfer.transfer_scope }), {
      status: 400, headers: corsHeaders,
    });
  }

  // Update transfer record
  await adminClient.from("property_transfers").update({
    status: "completed",
    new_property_id: newPropertyId,
  }).eq("id", transfer_id);

  // Update listing
  if (transfer.source_listing_id) {
    await adminClient.from("sale_listings").update({
      transfer_status: "completed",
      transferred_at: new Date().toISOString(),
    }).eq("id", transfer.source_listing_id);
  }

  // Notify seller
  await adminClient.from("notifications").insert({
    user_id: transfer.from_user_id,
    title: "Transfer Accepted",
    body: "The buyer has accepted the property transfer. Ownership has been transferred.",
    type: "property_transfer",
    reference_id: transfer.source_listing_id,
  });

  return new Response(
    JSON.stringify({
      success: true,
      message: "Transfer completed successfully",
      new_property_id: newPropertyId,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function executeUnitTransfer(
  adminClient: any, sellerId: string, buyerId: string,
  property: any, propertyId: string, roomId: string, includeTenants: boolean
): Promise<string | null> {
  // Verify room belongs to this property
  const { data: room } = await adminClient
    .from("rooms")
    .select("id, property_id")
    .eq("id", roomId)
    .eq("property_id", propertyId)
    .single();

  if (!room) throw new Error("Room not found in this property");

  // 1. Create cloned property for buyer
  const { data: newProp, error: cloneErr } = await adminClient
    .from("properties")
    .insert({
      owner_id: buyerId,
      name: property.name + " (Transferred)",
      address: property.address,
      division: property.division,
      district: property.district,
      thana: property.thana,
      area: property.area,
      postal_code: property.postal_code,
      house_number: property.house_number,
      road_number: property.road_number,
      sector: property.sector,
      block: property.block,
      property_type: property.property_type,
      has_generator: property.has_generator,
      has_parking: property.has_parking,
      has_gas_supply: property.has_gas_supply,
      has_water_supply: property.has_water_supply,
      has_rooftop_access: property.has_rooftop_access,
      has_garage: property.has_garage,
      has_internet: property.has_internet,
      has_dish: property.has_dish,
      has_security: property.has_security,
      has_cctv: property.has_cctv,
      has_lift: property.has_lift,
      tolet_phone: property.tolet_phone,
      map_url: property.map_url,
      nearest_police_station: property.nearest_police_station,
      nearest_fire_service: property.nearest_fire_service,
      nearest_electricity_office: property.nearest_electricity_office,
      total_rooms: 1,
    })
    .select("id")
    .single();

  if (cloneErr || !newProp) throw new Error("Failed to create buyer property");

  // 2. Move room to new property
  await adminClient.from("rooms").update({ property_id: newProp.id }).eq("id", roomId);

  if (includeTenants) {
    // 3. Transfer room-linked tenants
    await adminClient.from("tenants").update({ owner_id: buyerId }).eq("owner_id", sellerId).eq("room_id", roomId);

    // 4. Transfer room-linked bills
    await adminClient.from("bills").update({ owner_id: buyerId }).eq("owner_id", sellerId).eq("room_id", roomId);

    // 5. Transfer payments for those bills
    const { data: roomBills } = await adminClient.from("bills").select("id").eq("owner_id", buyerId).eq("room_id", roomId);
    if (roomBills && roomBills.length > 0) {
      await adminClient.from("payments").update({ owner_id: buyerId }).eq("owner_id", sellerId).in("bill_id", roomBills.map((b: any) => b.id));
    }

    // 6. Transfer room-linked meters
    await adminClient.from("meters").update({ owner_id: buyerId }).eq("owner_id", sellerId).eq("room_id", roomId);

    // 7. Transfer room-linked garages
    await adminClient.from("garages").update({ owner_id: buyerId }).eq("owner_id", sellerId).eq("property_id", propertyId).eq("room_id", roomId);
  } else {
    // Without tenants: unlink tenants from this room (keep with seller)
    await adminClient.from("tenants").update({ room_id: null }).eq("owner_id", sellerId).eq("room_id", roomId);

    // Keep bills, payments, meters with seller but unlink room reference
    // Meters: unlink from room
    await adminClient.from("meters").update({ room_id: null }).eq("owner_id", sellerId).eq("room_id", roomId);

    // Garages linked to room: unlink
    await adminClient.from("garages").update({ room_id: null }).eq("owner_id", sellerId).eq("property_id", propertyId).eq("room_id", roomId);
  }

  // Update seller property room count
  const { data: remainingRooms } = await adminClient.from("rooms").select("id").eq("property_id", propertyId);
  await adminClient.from("properties").update({ total_rooms: (remainingRooms || []).length }).eq("id", propertyId);

  return newProp.id;
}

async function executeFullPropertyTransfer(
  adminClient: any, sellerId: string, buyerId: string, propertyId: string
) {
  await adminClient.from("properties").update({ owner_id: buyerId }).eq("id", propertyId);

  const { data: propertyRooms } = await adminClient.from("rooms").select("id").eq("property_id", propertyId);
  const roomIds = (propertyRooms || []).map((r: any) => r.id);

  if (roomIds.length > 0) {
    await adminClient.from("tenants").update({ owner_id: buyerId }).eq("owner_id", sellerId).in("room_id", roomIds);
    await adminClient.from("bills").update({ owner_id: buyerId }).eq("owner_id", sellerId).in("room_id", roomIds);

    const { data: bills } = await adminClient.from("bills").select("id").eq("owner_id", buyerId).in("room_id", roomIds);
    if (bills && bills.length > 0) {
      await adminClient.from("payments").update({ owner_id: buyerId }).eq("owner_id", sellerId).in("bill_id", bills.map((b: any) => b.id));
    }

    await adminClient.from("meters").update({ owner_id: buyerId }).eq("owner_id", sellerId).in("room_id", roomIds);
  }

  await adminClient.from("garages").update({ owner_id: buyerId }).eq("owner_id", sellerId).eq("property_id", propertyId);
  await adminClient.from("notices").update({ owner_id: buyerId }).eq("owner_id", sellerId).eq("target_type", "property").eq("target_id", propertyId);
}
