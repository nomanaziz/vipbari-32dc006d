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
      let meta = verifyData.meta_data || verifyData.metadata || {};
      if (typeof meta === "string") {
        try { meta = JSON.parse(meta); } catch { meta = {}; }
      }

      const boostType = meta.boost_type || "3_day";
      const boostCount = parseInt(meta.boost_count) || 1;

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

      // Insert boost balance
      await adminClient.from("boost_balances").insert({
        user_id: userId,
        boost_type: boostType,
        total_count: boostCount,
        used_count: 0,
      });

      return new Response(
        JSON.stringify({ status: "completed", message: "Boost balance added" }),
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
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
