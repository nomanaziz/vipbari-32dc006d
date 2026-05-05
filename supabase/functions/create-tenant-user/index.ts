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

    // Verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No auth header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !caller) throw new Error("Invalid token");

    const callerId = caller.id;

    // Verify caller is landlord or landlord_staff
    const { data: isLandlord } = await supabaseAdmin.rpc("has_role", { _user_id: callerId, _role: "landlord" });
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: callerId, _role: "admin" });

    let landlordId = callerId;

    if (!isLandlord && !isAdmin) {
      // Check if staff
      const { data: staffAssignment } = await supabaseAdmin
        .from("staff_assignments")
        .select("landlord_id")
        .eq("user_id", callerId)
        .maybeSingle();

      if (!staffAssignment?.landlord_id) throw new Error("Not authorized");
      landlordId = staffAssignment.landlord_id;
    }

    const body = await req.json();
    const {
      full_name, phone, password,
      secondary_phone, nid, emergency_contact,
      move_in_date, room_id, billing_type,
      advance_balance,
      permanent_division, permanent_district, permanent_thana,
      permanent_village, permanent_address,
    } = body;

    if (!full_name || !phone || !password) {
      throw new Error("Missing required fields: full_name, phone, password");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Generate placeholder email from phone
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const placeholderEmail = `${cleanPhone}@tenant.varaplus.xyz`;

    // Create auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: placeholderEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone,
        email: placeholderEmail,
        role: "tenant",
      },
    });

    if (createError) {
      if (createError.message?.includes("already been registered")) {
        throw new Error("This phone number already has an account");
      }
      throw createError;
    }

    const newUserId = newUser.user!.id;

    // The handle_new_user trigger auto-creates profile, user_role, and tenant record.
    // Now update the tenant record: set owner_id to landlord, assign room, and set fields.
    // Small delay to let trigger complete
    await new Promise(r => setTimeout(r, 500));

    // Find the tenant record created by trigger
    const { data: tenantRecord } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("user_id", newUserId)
      .maybeSingle();

    if (!tenantRecord) {
      throw new Error("Tenant record not created automatically");
    }

    const tenantId = tenantRecord.id;

    // Update tenant with landlord's data
    const updatePayload: Record<string, unknown> = {
      owner_id: landlordId,
      status: "active",
      full_name,
      phone,
      secondary_phone: secondary_phone || "",
      nid: nid || null,
      emergency_contact: emergency_contact || null,
      move_in_date: move_in_date || null,
      room_id: room_id || null,
      billing_type: billing_type || "billing",
      advance_balance: advance_balance ? parseFloat(advance_balance) : 0,
      permanent_division: permanent_division || "",
      permanent_district: permanent_district || "",
      permanent_thana: permanent_thana || "",
      permanent_village: permanent_village || "",
      permanent_address: permanent_address || "",
    };

    const { error: updateError } = await supabaseAdmin
      .from("tenants")
      .update(updatePayload)
      .eq("id", tenantId);

    if (updateError) throw updateError;

    // If room assigned, update room status
    if (room_id) {
      const { error: roomErr } = await supabaseAdmin
        .from("rooms")
        .update({ status: "occupied", is_tolet: false, available_from: null, tenant_id: tenantId })
        .eq("id", room_id);
      if (roomErr) throw roomErr;
    }

    return new Response(JSON.stringify({
      user_id: newUserId,
      tenant_id: tenantId,
      phone,
      password,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
