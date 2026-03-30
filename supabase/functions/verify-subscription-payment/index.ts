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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: corsHeaders,
      });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const { transaction_id } = body;

    if (!transaction_id) {
      return new Response(JSON.stringify({ error: "Missing transaction_id" }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Verify with Recharge Server
    const apiKey = Deno.env.get("RECHARGE_API_KEY")!;
    const secretKey = Deno.env.get("RECHARGE_SECRET_KEY")!;
    const brandKey = Deno.env.get("RECHARGE_BRAND_KEY")!;

    const verifyRes = await fetch(
      "https://payment.rechargeserver.com/api/payment/verify",
      {
        method: "POST",
        headers: {
          "API-KEY": apiKey,
          "SECRET-KEY": secretKey,
          "BRAND-KEY": brandKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transaction_id }),
      }
    );

    const verifyData = await verifyRes.json();
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (verifyData.status === "COMPLETED") {
      // Extract metadata from verification response (handle both field names)
      let meta = verifyData.meta_data || verifyData.metadata || {};
      if (typeof meta === "string") {
        try { meta = JSON.parse(meta); } catch { meta = {}; }
      }
      const productType = meta.product_type || "room_management";
      const roomCount = parseInt(meta.room_count) || 0;
      const toletCount = parseInt(meta.tolet_count) || 0;
      const saleListingCount = parseInt(meta.sale_listing_count) || 0;
      const durationMonths = parseInt(meta.duration_months) || 2;
      const discountPercent = parseFloat(meta.discount_percent) || 0;
      const couponCode = meta.coupon_code || null;

      // Update payment record
      await adminClient
        .from("subscription_payments")
        .update({
          status: "completed",
          transaction_id,
          payment_method: verifyData.payment_method || null,
          metadata: verifyData,
        })
        .eq("user_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);

      // Get a plan_id
      const { data: plans } = await adminClient
        .from("subscription_plans")
        .select("id")
        .eq("is_active", true)
        .order("sort_order")
        .limit(1);

      const planId = plans?.[0]?.id;
      if (!planId) {
        return new Response(JSON.stringify({ error: "No plan found" }), {
          status: 500, headers: corsHeaders,
        });
      }

      // Check existing active subscription for extension
      const { data: existingSubs } = await adminClient
        .from("user_subscriptions")
        .select("expires_at")
        .eq("user_id", userId)
        .eq("product_type", productType)
        .eq("status", "active")
        .order("expires_at", { ascending: false })
        .limit(1);

      const currentExpiry = existingSubs?.[0]?.expires_at
        ? new Date(existingSubs[0].expires_at)
        : new Date();
      const startsAt = currentExpiry > new Date() ? currentExpiry : new Date();
      const expiresAt = new Date(startsAt.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);

      // Handle first-time to-let free slots
      if (productType === "tolet") {
        const { data: prevTolet } = await adminClient
          .from("user_subscriptions")
          .select("id")
          .eq("user_id", userId)
          .eq("product_type", "tolet")
          .limit(1);

        if (!prevTolet || prevTolet.length === 0) {
          const freeExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await adminClient.from("user_subscriptions").insert({
            user_id: userId,
            plan_id: planId,
            starts_at: new Date().toISOString(),
            expires_at: freeExpiry.toISOString(),
            status: "active",
            product_type: "tolet",
            tolet_count: 2,
            tolet_price_per_unit: 0,
            room_count: 0,
            duration_months: 1,
            discount_percent: 0,
            coupon_code: null,
          });
        }
      }

      // Insert the paid subscription
      await adminClient.from("user_subscriptions").insert({
        user_id: userId,
        plan_id: planId,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: "active",
        product_type: productType,
        room_count: productType === "room_management" ? roomCount : 0,
        tolet_count: productType === "tolet" ? toletCount : 0,
        tolet_price_per_unit: productType === "tolet" ? 50 : 0,
        sale_listing_count: productType === "sale_listing" ? saleListingCount : 0,
        duration_months: durationMonths,
        discount_percent: discountPercent,
        coupon_code: couponCode,
      });

      return new Response(
        JSON.stringify({ status: "completed", message: "Subscription activated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (verifyData.status === "PENDING") {
      return new Response(
        JSON.stringify({ status: "pending", message: "Payment is still pending" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Update payment as failed
      await adminClient
        .from("subscription_payments")
        .update({ status: "failed", transaction_id, metadata: verifyData })
        .eq("user_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);

      return new Response(
        JSON.stringify({ status: "failed", message: verifyData.message || "Payment failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
