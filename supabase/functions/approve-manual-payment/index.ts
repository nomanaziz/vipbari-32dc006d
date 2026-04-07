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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized");

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admin access required");

    const { payment_id, action, reject_reason } = await req.json();
    if (!payment_id || !["approve", "reject"].includes(action)) {
      throw new Error("Invalid request: payment_id and action (approve/reject) required");
    }

    // Get the payment record
    const { data: payment, error: payErr } = await supabase
      .from("subscription_payments")
      .select("*")
      .eq("id", payment_id)
      .single();

    if (payErr || !payment) throw new Error("Payment not found");
    if (payment.status !== "manual_pending") {
      throw new Error("Payment is not in manual_pending status");
    }

    if (action === "reject") {
      await supabase
        .from("subscription_payments")
        .update({ status: "rejected" })
        .eq("id", payment_id);

      return new Response(JSON.stringify({ success: true, status: "rejected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Approve: update payment status
    await supabase
      .from("subscription_payments")
      .update({ status: "completed" })
      .eq("id", payment_id);

    // Create or extend subscription
    const userId = payment.user_id;
    const productType = payment.product_type;
    const roomCount = payment.room_count || 0;
    const toletCount = payment.tolet_count || 0;
    const durationMonths = payment.duration_months || 1;
    const discountPercent = payment.discount_percent || 0;
    const couponCode = payment.coupon_code || null;

    // Get a plan_id (use first active plan as reference)
    const { data: plans } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("is_active", true)
      .limit(1);

    const planId = plans?.[0]?.id;
    if (!planId) throw new Error("No active subscription plan found");

    // Check for existing active subscription to extend
    const { data: existingSubs } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("product_type", productType)
      .eq("status", "active")
      .order("expires_at", { ascending: false })
      .limit(1);

    const existingSub = existingSubs?.[0];
    const now = new Date();
    let startsAt = now;

    if (existingSub?.expires_at && new Date(existingSub.expires_at) > now) {
      startsAt = new Date(existingSub.expires_at);
    }

    const expiresAt = new Date(startsAt.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);

    const pricePerUnit = productType === "tolet" ? 50 : 10;

    const { error: subErr } = await supabase.from("user_subscriptions").insert({
      user_id: userId,
      plan_id: planId,
      product_type: productType,
      room_count: roomCount,
      tolet_count: toletCount,
      duration_months: durationMonths,
      discount_percent: discountPercent,
      coupon_code: couponCode,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: "active",
      tolet_price_per_unit: pricePerUnit,
    });

    if (subErr) throw new Error(`Failed to create subscription: ${subErr.message}`);


    return new Response(
      JSON.stringify({ success: true, status: "completed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
