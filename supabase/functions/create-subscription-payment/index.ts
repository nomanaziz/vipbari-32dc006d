import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_PER_ROOM = 10;
const PRICE_PER_TOLET = 50;
const PRICE_PER_SALE_LISTING = 200;

const getDurationDiscount = (months: number): number =>
  months < 6 ? 0 : Math.min(35, Math.round(5 + (months - 6)));

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

    // Fetch user profile for required cus_name and cus_email fields
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: profileData } = await adminClient
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", userId)
      .single();

    const cusName = profileData?.full_name || "Customer";
    const cusEmail = profileData?.email || "customer@example.com";

    const body = await req.json();
    const {
      product_type,
      room_count = 0,
      tolet_count = 0,
      sale_listing_count = 0,
      duration_months,
      discount_percent = 0,
      coupon_code = null,
      success_url,
      cancel_url,
    } = body;

    // Server-side price calculation to prevent tampering
    if (duration_months < 1 || duration_months > 36) {
      return new Response(JSON.stringify({ error: "Invalid duration" }), {
        status: 400, headers: corsHeaders,
      });
    }

    const expectedDiscount = getDurationDiscount(duration_months);
    let basePrice = 0;
    if (product_type === "room_management") {
      basePrice = room_count * PRICE_PER_ROOM * duration_months;
    } else if (product_type === "tolet") {
      basePrice = tolet_count * PRICE_PER_TOLET * duration_months;
    } else if (product_type === "sale_listing") {
      basePrice = sale_listing_count * PRICE_PER_SALE_LISTING * duration_months;
    } else {
      return new Response(JSON.stringify({ error: "Invalid product type" }), {
        status: 400, headers: corsHeaders,
      });
    }

    const discountAmount = Math.round(basePrice * (expectedDiscount / 100));
    const totalAmount = basePrice - discountAmount;

    if (totalAmount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Call Recharge Server API
    const apiKey = Deno.env.get("RECHARGE_API_KEY")!;
    const secretKey = Deno.env.get("RECHARGE_SECRET_KEY")!;
    const brandKey = Deno.env.get("RECHARGE_BRAND_KEY")!;

    const paymentRes = await fetch(
      "https://payment.rechargeserver.com/api/payment/create",
      {
        method: "POST",
        headers: {
          "API-KEY": apiKey,
          "SECRET-KEY": secretKey,
          "BRAND-KEY": brandKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cus_name: cusName,
          cus_email: cusEmail,
          success_url: success_url || `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/subscription?payment=success`,
          cancel_url: cancel_url || `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/subscription?payment=cancel`,
          amount: totalAmount.toString(),
          meta_data: JSON.stringify({
            user_id: userId,
            product_type,
            room_count,
            tolet_count,
            sale_listing_count,
            duration_months,
            discount_percent: expectedDiscount,
            coupon_code,
          }),
        }),
      }
    );

    const paymentData = await paymentRes.json();

    if (!paymentData.status || !paymentData.payment_url) {
      return new Response(
        JSON.stringify({ error: paymentData.message || "Payment creation failed" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Insert pending payment record
    await adminClient.from("subscription_payments").insert({
      user_id: userId,
      transaction_id: null,
      amount: totalAmount,
      status: "pending",
      product_type,
      room_count,
      tolet_count,
      sale_listing_count,
      duration_months,
      discount_percent: expectedDiscount,
      coupon_code,
      metadata: paymentData,
    });

    return new Response(
      JSON.stringify({ payment_url: paymentData.payment_url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
