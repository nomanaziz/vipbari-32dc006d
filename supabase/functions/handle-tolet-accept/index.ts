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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the calling user
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { requestId, action } = await req.json();

    if (!requestId || !["accept", "reject"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid request. Provide requestId and action (accept/reject)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for cross-table updates
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the request
    const { data: request, error: reqError } = await supabase
      .from("tolet_requests")
      .select("*, rooms(id, room_number, property_id, properties(name, owner_id))")
      .eq("id", requestId)
      .single();

    if (reqError || !request) {
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller is the landlord
    if (request.landlord_user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (request.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Request is no longer pending" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const roomName = `${request.rooms?.room_number} — ${request.rooms?.properties?.name}`;

    if (action === "reject") {
      // Simply reject and notify tenant
      await supabase
        .from("tolet_requests")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", requestId);

      await supabase.from("notifications").insert({
        user_id: request.tenant_user_id,
        title: "Request Rejected",
        body: `Your rental request for ${roomName} has been rejected.`,
        type: "request_rejected",
        reference_id: requestId,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: ACCEPT
    const roomId = request.room_id;
    const tenantUserId = request.tenant_user_id;
    const landlordUserId = request.landlord_user_id;

    // Find the tenant record
    const { data: tenantRecord } = await supabase
      .from("tenants")
      .select("id")
      .eq("user_id", tenantUserId)
      .maybeSingle();

    if (!tenantRecord) {
      return new Response(
        JSON.stringify({ error: "Tenant record not found for this user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Update the request status to accepted
    await supabase
      .from("tolet_requests")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", requestId);

    // 2. Update the room: assign tenant, mark occupied, remove from tolet, clear available_from
    await supabase
      .from("rooms")
      .update({
        status: "occupied",
        is_tolet: false,
        available_from: null,
        tenant_id: tenantRecord.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", roomId);

    // 3. Update the tenant record: assign room and landlord
    await supabase
      .from("tenants")
      .update({
        room_id: roomId,
        owner_id: landlordUserId,
        move_in_date: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantRecord.id);

    // 4. Reject all other pending requests for the same room
    const { data: otherRequests } = await supabase
      .from("tolet_requests")
      .select("id, tenant_user_id")
      .eq("room_id", roomId)
      .eq("status", "pending")
      .neq("id", requestId);

    if (otherRequests && otherRequests.length > 0) {
      const otherIds = otherRequests.map((r: any) => r.id);
      await supabase
        .from("tolet_requests")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .in("id", otherIds);

      // Notify rejected tenants
      const rejectedNotifications = otherRequests.map((r: any) => ({
        user_id: r.tenant_user_id,
        title: "Request Rejected",
        body: `Your rental request for ${roomName} has been rejected (room assigned to another tenant).`,
        type: "request_rejected",
        reference_id: r.id,
      }));
      await supabase.from("notifications").insert(rejectedNotifications);
    }

    // 5. Notify accepted tenant
    await supabase.from("notifications").insert({
      user_id: tenantUserId,
      title: "Request Accepted! 🎉",
      body: `Your rental request for ${roomName} has been accepted. The room is now assigned to you.`,
      type: "request_accepted",
      reference_id: requestId,
    });

    // 6. Notify landlord confirmation
    // Get tenant name
    const { data: tenantProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", tenantUserId)
      .maybeSingle();

    await supabase.from("notifications").insert({
      user_id: landlordUserId,
      title: "Room Assigned",
      body: `${roomName} has been assigned to ${tenantProfile?.full_name || "tenant"}.`,
      type: "room_assigned",
      reference_id: requestId,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
