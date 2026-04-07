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

    const { action, phone, tenant_id, room_id, invitation_id, response } = await req.json();

    // ─── ACTION: SEARCH ───────────────────────────────
    if (action === "search") {
      const { data: roleData } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "landlord")
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: "Only landlords can search tenants" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!phone || phone.length < 4) {
        return new Response(JSON.stringify({ error: "Phone number too short" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get blocks involving this landlord
      const { data: blocks } = await adminClient
        .from("user_blocks")
        .select("blocker_id, blocked_id")
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

      const blockedUserIds = new Set<string>();
      for (const b of blocks || []) {
        if (b.blocker_id === user.id) blockedUserIds.add(b.blocked_id);
        if (b.blocked_id === user.id) blockedUserIds.add(b.blocker_id);
      }

      const { data: matchingProfiles } = await adminClient
        .from("profiles")
        .select("user_id, full_name, phone")
        .ilike("phone", `%${phone}%`)
        .limit(10);

      const validTenants: any[] = [];
      const seenTenantIds = new Set<string>();

      for (const profile of matchingProfiles || []) {
        // Skip blocked users
        if (blockedUserIds.has(profile.user_id)) {
          continue;
        }

        const { data: tenantRole } = await adminClient
          .from("user_roles")
          .select("user_id")
          .eq("user_id", profile.user_id)
          .eq("role", "tenant")
          .maybeSingle();

        if (!tenantRole) continue;

        const { data: tenantRows } = await adminClient
          .from("tenants")
          .select("id, full_name, phone, user_id, owner_id, status")
          .eq("user_id", profile.user_id)
          .order("created_at", { ascending: false })
          .limit(1);

        let tenant = tenantRows?.[0] || null;

        if (!tenant) {
          const { data: createdTenant, error: createTenantError } = await adminClient
            .from("tenants")
            .insert({
              user_id: profile.user_id,
              owner_id: profile.user_id,
              full_name: profile.full_name || "",
              phone: profile.phone || phone,
              status: "active",
            })
            .select("id, full_name, phone, user_id, owner_id, status")
            .single();

          if (createTenantError || !createdTenant) continue;
          tenant = createdTenant;
        }

        if (!tenant.user_id || tenant.owner_id !== tenant.user_id || tenant.status !== "active") continue;
        if (seenTenantIds.has(tenant.id)) continue;

        const { data: existingInvite } = await adminClient
          .from("tenant_invitations")
          .select("status")
          .eq("landlord_id", user.id)
          .eq("tenant_id", tenant.id)
          .maybeSingle();

        validTenants.push({
          ...tenant,
          full_name: profile.full_name || tenant.full_name,
          phone: profile.phone || tenant.phone,
          invitation_status: existingInvite?.status || null,
        });
        seenTenantIds.add(tenant.id);
      }

      return new Response(JSON.stringify({ tenants: validTenants }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ACTION: INVITE ───────────────────────────────
    if (action === "invite") {
      const { data: roleData } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "landlord")
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: "Only landlords can invite tenants" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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

      // Check blocks
      const { data: blockExists } = await adminClient
        .from("user_blocks")
        .select("id")
        .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${tenant.user_id}),and(blocker_id.eq.${tenant.user_id},blocked_id.eq.${user.id})`)
        .maybeSingle();

      if (blockExists) {
        return new Response(JSON.stringify({ error: "Cannot invite — user is blocked" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if invitation already exists
      const { data: existingInvite } = await adminClient
        .from("tenant_invitations")
        .select("id, status")
        .eq("landlord_id", user.id)
        .eq("tenant_id", tenant_id)
        .maybeSingle();

      if (existingInvite) {
        if (existingInvite.status === "pending") {
          return new Response(JSON.stringify({ error: "Invitation already sent and pending" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (existingInvite.status === "accepted") {
          return new Response(JSON.stringify({ error: "Tenant already accepted your invitation" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // If rejected → delete old invitation so we can re-send
        if (existingInvite.status === "rejected") {
          await adminClient
            .from("tenant_invitations")
            .delete()
            .eq("id", existingInvite.id);
        }
      }

      // Insert invitation
      const { error: insertError } = await adminClient
        .from("tenant_invitations")
        .insert({
          landlord_id: user.id,
          tenant_id: tenant_id,
          tenant_user_id: tenant.user_id,
          room_id: room_id || null,
          status: "pending",
        });

      if (insertError) {
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create notification for tenant
      await adminClient.from("notifications").insert({
        user_id: tenant.user_id,
        title: "New Landlord Invitation",
        body: "A landlord has invited you to link with their property. Please check and respond.",
        type: "tenant_invitation",
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ACTION: RESPOND (tenant accepts/rejects) ─────
    if (action === "respond") {
      if (!invitation_id || !response || !["accepted", "rejected"].includes(response)) {
        return new Response(JSON.stringify({ error: "invitation_id and response (accepted/rejected) required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: invite } = await adminClient
        .from("tenant_invitations")
        .select("*")
        .eq("id", invitation_id)
        .eq("tenant_user_id", user.id)
        .eq("status", "pending")
        .single();

      if (!invite) {
        return new Response(JSON.stringify({ error: "Invitation not found or already responded" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await adminClient
        .from("tenant_invitations")
        .update({ status: response })
        .eq("id", invitation_id);

      if (response === "accepted") {
        const updateData: any = { owner_id: invite.landlord_id };
        if (invite.room_id) {
          updateData.room_id = invite.room_id;
        }

        const { error: updateError } = await adminClient
          .from("tenants")
          .update(updateData)
          .eq("id", invite.tenant_id);

        if (updateError) {
          await adminClient
            .from("tenant_invitations")
            .update({ status: "pending" })
            .eq("id", invitation_id);
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (invite.room_id) {
          await adminClient
            .from("rooms")
            .update({ status: "occupied", tenant_id: invite.tenant_id })
            .eq("id", invite.room_id);
        }

        await adminClient.from("notifications").insert({
          user_id: invite.landlord_id,
          title: "Invitation Accepted",
          body: "A tenant has accepted your invitation and is now linked to your account.",
          type: "tenant_invitation_accepted",
        });
      } else {
        await adminClient.from("notifications").insert({
          user_id: invite.landlord_id,
          title: "Invitation Rejected",
          body: "A tenant has rejected your invitation.",
          type: "tenant_invitation_rejected",
        });
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
