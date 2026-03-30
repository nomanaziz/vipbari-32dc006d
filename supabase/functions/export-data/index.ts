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

    // Check role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roles } = await adminClient.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = roles?.some((r: any) => r.role === "admin");

    const { data_type = "all", format = "json" } = await req.json();

    const result: Record<string, any[]> = {};

    const ownerFilter = isAdmin ? {} : { owner_id: userId };

    if (data_type === "all" || data_type === "tenants") {
      const { data } = await adminClient.from("tenants").select("*").match(ownerFilter);
      result.tenants = data || [];
    }

    if (data_type === "all" || data_type === "rooms") {
      if (isAdmin) {
        const { data } = await adminClient.from("rooms").select("*, properties(name, owner_id)");
        result.rooms = data || [];
      } else {
        const { data: props } = await adminClient.from("properties").select("id").eq("owner_id", userId);
        const propIds = (props || []).map((p: any) => p.id);
        if (propIds.length > 0) {
          const { data } = await adminClient.from("rooms").select("*, properties(name)").in("property_id", propIds);
          result.rooms = data || [];
        } else {
          result.rooms = [];
        }
      }
    }

    if (data_type === "all" || data_type === "bills") {
      const { data } = await adminClient.from("bills").select("*").match(ownerFilter);
      result.bills = data || [];
    }

    if (format === "csv") {
      // Flatten to CSV - use first available data type
      const key = Object.keys(result)[0];
      const rows = result[key] || [];
      if (rows.length === 0) {
        return new Response("No data", { status: 200, headers: { ...corsHeaders, "Content-Type": "text/csv" } });
      }
      const headers = Object.keys(rows[0]);
      const csvLines = [headers.join(",")];
      rows.forEach((row: any) => {
        csvLines.push(headers.map((h) => JSON.stringify(row[h] ?? "")).join(","));
      });
      return new Response(csvLines.join("\n"), {
        headers: { ...corsHeaders, "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=backup.csv" },
      });
    }

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Content-Disposition": "attachment; filename=backup.json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
