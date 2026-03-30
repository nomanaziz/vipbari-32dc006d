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
    if (!authHeader) throw new Error("Missing auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !user) throw new Error("Unauthorized");

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Check admin role
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admin only");

    const { user_id, product_type, room_count, tolet_count, sale_listing_count, duration_months, boost_type, boost_count } = await req.json();

    if (!user_id || !product_type) {
      throw new Error("Missing required fields");
    }

    // Handle boost product types
    if (product_type === "boost_3_day" || product_type === "boost_7_day") {
      const bType = product_type === "boost_3_day" ? "3_day" : "7_day";
      const count = boost_count || 1;

      const { error: insertErr } = await supabaseAdmin
        .from("boost_balances")
        .insert({
          user_id,
          boost_type: bType,
          total_count: count,
          used_count: 0,
        });

      if (insertErr) throw insertErr;
    } else {
      if (!duration_months) throw new Error("Missing duration_months");

      // Get first active plan
      const { data: plans } = await supabaseAdmin
        .from("subscription_plans")
        .select("id")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(1);

      if (!plans || plans.length === 0) throw new Error("No active plan found");
      const planId = plans[0].id;

      // Check if user has an existing active subscription of same product_type
      const { data: existing } = await supabaseAdmin
        .from("user_subscriptions")
        .select("id, expires_at")
        .eq("user_id", user_id)
        .eq("product_type", product_type)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1);

      let startsAt: string;
      if (existing && existing.length > 0 && existing[0].expires_at) {
        startsAt = existing[0].expires_at;
      } else {
        startsAt = new Date().toISOString();
      }

      const expiresAt = new Date(startsAt);
      expiresAt.setMonth(expiresAt.getMonth() + duration_months);

      const { error: insertErr } = await supabaseAdmin
        .from("user_subscriptions")
        .insert({
          user_id,
          plan_id: planId,
          product_type,
          room_count: product_type === "room_management" ? (room_count || 1) : 0,
          tolet_count: product_type === "tolet" ? (tolet_count || 1) : 0,
          sale_listing_count: product_type === "sale_listing" ? (sale_listing_count || 1) : 0,
          duration_months,
          discount_percent: 100,
          status: "active",
          starts_at: startsAt,
          expires_at: expiresAt.toISOString(),
        });

      if (insertErr) throw insertErr;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
