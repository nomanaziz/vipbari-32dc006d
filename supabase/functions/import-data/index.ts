import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roles } = await adminClient.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = roles?.some((r: any) => r.role === "admin");

    const { backup } = await req.json();
    if (!backup || typeof backup !== "object") {
      return new Response(JSON.stringify({ error: "Invalid backup format" }), { status: 400, headers: corsHeaders });
    }

    const results: Record<string, number> = {};

    if (backup.tenants && Array.isArray(backup.tenants)) {
      const tenants = backup.tenants.map((t: any) => ({
        ...t,
        owner_id: isAdmin ? t.owner_id : userId,
      }));
      const { error } = await adminClient.from("tenants").upsert(tenants, { onConflict: "id" });
      if (error) throw new Error(`Tenants restore failed: ${error.message}`);
      results.tenants = tenants.length;
    }

    if (backup.bills && Array.isArray(backup.bills)) {
      const bills = backup.bills.map((b: any) => ({
        ...b,
        owner_id: isAdmin ? b.owner_id : userId,
      }));
      const { error } = await adminClient.from("bills").upsert(bills, { onConflict: "id" });
      if (error) throw new Error(`Bills restore failed: ${error.message}`);
      results.bills = bills.length;
    }

    return new Response(JSON.stringify({ success: true, restored: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
