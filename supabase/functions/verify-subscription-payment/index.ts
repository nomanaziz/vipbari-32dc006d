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
      // Extract metadata
      let meta = verifyData.meta_data || verifyData.metadata || {};
      if (typeof meta === "string") {
        try { meta = JSON.parse(meta); } catch { meta = {}; }
      }

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

      // Check if this is a cart payment (multi-item)
      const isCart = meta.is_cart === true && Array.isArray(meta.cart_items);

      if (isCart) {
        await activateCartItems(adminClient, userId, meta.cart_items);
      } else {
        await activateSingleItem(adminClient, userId, meta);
      }

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

// Activate a single item (legacy flow)
async function activateSingleItem(adminClient: any, userId: string, meta: any) {
  const productType = meta.product_type || "room_management";
  const roomCount = parseInt(meta.room_count) || 0;
  const toletCount = parseInt(meta.tolet_count) || 0;
  const saleListingCount = parseInt(meta.sale_listing_count) || 0;
  const durationMonths = parseInt(meta.duration_months) || 2;
  const discountPercent = parseFloat(meta.discount_percent) || 0;
  const couponCode = meta.coupon_code || null;

  const planId = await getDefaultPlanId(adminClient);
  if (!planId) return;

  await createSubscription(adminClient, userId, planId, {
    productType, roomCount, toletCount, saleListingCount, durationMonths, discountPercent, couponCode,
  });

}
// Activate multiple cart items
async function activateCartItems(adminClient: any, userId: string, cartItems: any[]) {
  const planId = await getDefaultPlanId(adminClient);
  if (!planId) return;

  for (const item of cartItems) {
    const { type, count, duration_months, discount_percent, coupon_code } = item;

    if (type === "room_management" || type === "tolet" || type === "sale_listing") {
      await createSubscription(adminClient, userId, planId, {
        productType: type,
        roomCount: type === "room_management" ? count : 0,
        toletCount: type === "tolet" ? count : 0,
        saleListingCount: type === "sale_listing" ? count : 0,
        durationMonths: duration_months,
        discountPercent: discount_percent || 0,
        couponCode: coupon_code || null,
      });

      if (type === "tolet") {
        await handleFreeTolet(adminClient, userId, planId);
      }
    } else if (type === "boost_3_day" || type === "boost_7_day") {
      const boostType = type === "boost_3_day" ? "3_day" : "7_day";
      // Check existing balance
      const { data: existing } = await adminClient
        .from("boost_balances")
        .select("id, total_count")
        .eq("user_id", userId)
        .eq("boost_type", boostType)
        .limit(1);

      if (existing && existing.length > 0) {
        await adminClient
          .from("boost_balances")
          .update({ total_count: existing[0].total_count + count })
          .eq("id", existing[0].id);
      } else {
        await adminClient.from("boost_balances").insert({
          user_id: userId,
          boost_type: boostType,
          total_count: count,
          used_count: 0,
        });
      }
    } else if (type === "sms") {
      // Add SMS credits
      const { data: existingSms } = await adminClient
        .from("sms_balances")
        .select("id, total_count")
        .eq("user_id", userId)
        .limit(1);

      if (existingSms && existingSms.length > 0) {
        await adminClient
          .from("sms_balances")
          .update({ total_count: existingSms[0].total_count + count })
          .eq("id", existingSms[0].id);
      } else {
        await adminClient.from("sms_balances").insert({
          user_id: userId,
          total_count: count,
          used_count: 0,
        });
      }
    }
  }
}

async function getDefaultPlanId(adminClient: any): Promise<string | null> {
  const { data: plans } = await adminClient
    .from("subscription_plans")
    .select("id")
    .eq("is_active", true)
    .order("sort_order")
    .limit(1);
  return plans?.[0]?.id || null;
}

async function createSubscription(
  adminClient: any,
  userId: string,
  planId: string,
  opts: {
    productType: string;
    roomCount: number;
    toletCount: number;
    saleListingCount: number;
    durationMonths: number;
    discountPercent: number;
    couponCode: string | null;
  }
) {
  const { productType, roomCount, toletCount, saleListingCount, durationMonths, discountPercent, couponCode } = opts;

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
}

async function handleFreeTolet(adminClient: any, userId: string, planId: string) {
  const { data: prevTolet } = await adminClient
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("product_type", "tolet")
    .limit(1);

  // Only give free slots if this is the very first tolet subscription (the one we just inserted)
  if (prevTolet && prevTolet.length <= 1) {
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
