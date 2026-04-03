import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_PER_ROOM = 10;
const PRICE_PER_TOLET = 50;
const PRICE_PER_SALE_LISTING = 200;
const BOOST_PRICES: Record<string, number> = { boost_3_day: 30, boost_7_day: 50 };
const PRICE_PER_SMS = 0.5;

const getDurationDiscount = (months: number): number =>
  months < 6 ? 0 : Math.min(35, Math.round(5 + (months - 6)));

interface CartItem {
  type: string;
  count: number;
  duration_months: number;
  coupon_code?: string | null;
}

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

    // Fetch user profile
    const { data: profileData } = await adminClient
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", userId)
      .single();

    const cusName = profileData?.full_name || "Customer";
    const cusEmail = profileData?.email || "customer@example.com";

    const body = await req.json();
    const { items, success_url, cancel_url } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Calculate server-side total
    let totalAmount = 0;
    const processedItems: any[] = [];

    for (const item of items as CartItem[]) {
      const { type, count, duration_months } = item;

      if (!count || count < 1) {
        return new Response(JSON.stringify({ error: `Invalid count for ${type}` }), {
          status: 400, headers: corsHeaders,
        });
      }

      let lineTotal = 0;
      let discount = 0;

      if (type === "room_management" || type === "tolet" || type === "sale_listing") {
        if (!duration_months || duration_months < 1 || duration_months > 36) {
          return new Response(JSON.stringify({ error: `Invalid duration for ${type}` }), {
            status: 400, headers: corsHeaders,
          });
        }
        const unitPrice = type === "room_management" ? PRICE_PER_ROOM
          : type === "tolet" ? PRICE_PER_TOLET
          : PRICE_PER_SALE_LISTING;
        const base = count * unitPrice * duration_months;
        discount = getDurationDiscount(duration_months);
        const discountAmt = Math.round(base * (discount / 100));
        lineTotal = base - discountAmt;
      } else if (type === "boost_3_day" || type === "boost_7_day") {
        lineTotal = count * BOOST_PRICES[type];
      } else if (type === "sms") {
        if (count < 100) {
          return new Response(JSON.stringify({ error: "Minimum 100 SMS required" }), {
            status: 400, headers: corsHeaders,
          });
        }
        lineTotal = Math.round(count * PRICE_PER_SMS);
      } else {
        return new Response(JSON.stringify({ error: `Invalid item type: ${type}` }), {
          status: 400, headers: corsHeaders,
        });
      }

      processedItems.push({
        type,
        count,
        duration_months: duration_months || 0,
        discount_percent: discount,
        coupon_code: item.coupon_code || null,
        line_total: lineTotal,
      });
      totalAmount += lineTotal;
    }

    if (totalAmount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid total amount" }), {
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
            cart_items: processedItems,
            is_cart: true,
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
      product_type: "cart",
      room_count: 0,
      tolet_count: 0,
      sale_listing_count: 0,
      duration_months: 0,
      discount_percent: 0,
      coupon_code: null,
      metadata: { ...paymentData, cart_items: processedItems, is_cart: true },
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
