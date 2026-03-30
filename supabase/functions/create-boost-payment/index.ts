import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BOOST_PRICES: Record<string, number> = {
  "3_day": 30,
  "7_day": 50,
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
    const { boost_type, count, success_url, cancel_url } = body;

    if (!boost_type || !BOOST_PRICES[boost_type]) {
      return new Response(JSON.stringify({ error: "Invalid boost type" }), {
        status: 400, headers: corsHeaders,
      });
    }
    if (!count || count < 1 || count > 50) {
      return new Response(JSON.stringify({ error: "Invalid count" }), {
        status: 400, headers: corsHeaders,
      });
    }

    const pricePerUnit = BOOST_PRICES[boost_type];
    const totalAmount = pricePerUnit * count;

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
          success_url: success_url || `${Deno.env.get("SUPABASE_URL")}/subscription?payment=success`,
          cancel_url: cancel_url || `${Deno.env.get("SUPABASE_URL")}/subscription?payment=cancel`,
          amount: totalAmount.toString(),
          meta_data: JSON.stringify({
            user_id: userId,
            product_type: `boost_${boost_type}`,
            boost_type,
            boost_count: count,
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
      product_type: `boost_${boost_type}`,
      room_count: 0,
      tolet_count: 0,
      duration_months: 0,
      discount_percent: 0,
      coupon_code: null,
      metadata: { ...paymentData, boost_type, boost_count: count },
    });

    return new Response(
      JSON.stringify({ payment_url: paymentData.payment_url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
