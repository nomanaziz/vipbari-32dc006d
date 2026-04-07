import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const dueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-10`;

    // Fetch all active tenants with billing_type = 'billing' who have a room
    const { data: tenants, error: tErr } = await supabase
      .from("tenants")
      .select("id, owner_id, room_id, rooms(id, rent_amount)")
      .eq("status", "active")
      .eq("billing_type", "billing")
      .not("room_id", "is", null);

    if (tErr) throw tErr;

    // Check existing bills for this month
    const { data: existingBills } = await supabase
      .from("bills")
      .select("tenant_id")
      .eq("month", month);

    const existingTenantIds = new Set((existingBills || []).map((b: any) => b.tenant_id));

    // Get unique owner_ids to fetch their utility configs
    const ownerIds = [...new Set((tenants || []).map((t: any) => t.owner_id))];
    const { data: settingsData } = await supabase
      .from("landlord_settings")
      .select("owner_id, value")
      .eq("key", "utility_config")
      .in("owner_id", ownerIds);

    const utilityMap = new Map<string, Record<string, { enabled: boolean; rate: string }>>();
    (settingsData || []).forEach((s: any) => {
      if (s.value && typeof s.value === "object") {
        utilityMap.set(s.owner_id, s.value);
      }
    });

    // Get property info for utilities_included check
    const roomIds = [...new Set((tenants || []).filter((t: any) => t.room_id).map((t: any) => t.room_id))];
    const { data: roomsData } = await supabase
      .from("rooms")
      .select("id, property_id")
      .in("id", roomIds.length > 0 ? roomIds : ["none"]);
    const roomPropertyMap = new Map<string, string>();
    (roomsData || []).forEach((r: any) => roomPropertyMap.set(r.id, r.property_id));

    const propertyIds = [...new Set([...roomPropertyMap.values()])];
    const { data: propsData } = await supabase
      .from("properties")
      .select("id, utilities_included, property_type")
      .in("id", propertyIds.length > 0 ? propertyIds : ["none"]);
    const propertyMap = new Map<string, any>();
    (propsData || []).forEach((p: any) => propertyMap.set(p.id, p));

    const newBills = (tenants || [])
      .filter((t: any) => !existingTenantIds.has(t.id) && t.rooms)
      .map((t: any) => {
        const cfg = utilityMap.get(t.owner_id);
        const rent = Number(t.rooms.rent_amount) || 0;
        const propId = roomPropertyMap.get(t.room_id);
        const prop = propId ? propertyMap.get(propId) : null;
        const utilitiesIncluded = prop?.utilities_included || prop?.property_type === "tin_shed";

        const elec = utilitiesIncluded ? 0 : (cfg?.electricity?.enabled ? Number(cfg.electricity.rate) || 0 : 0);
        const water = utilitiesIncluded ? 0 : (cfg?.water?.enabled ? Number(cfg.water.rate) || 0 : 0);
        const gas = utilitiesIncluded ? 0 : (cfg?.gas?.enabled ? Number(cfg.gas.rate) || 0 : 0);
        const wifi = cfg?.wifi?.enabled ? Number(cfg.wifi.rate) || 0 : 0;
        const generator = cfg?.generator?.enabled ? Number(cfg.generator.rate) || 0 : 0;
        const security = cfg?.security?.enabled ? Number(cfg.security.rate) || 0 : 0;
        const other = cfg?.other?.enabled ? Number(cfg.other.rate) || 0 : 0;
        const total = rent + elec + water + gas + wifi + generator + security + other;

        return {
          tenant_id: t.id,
          room_id: t.room_id,
          owner_id: t.owner_id,
          month,
          due_date: dueDate,
          rent_amount: rent,
          electricity_charge: elec,
          water_charge: water,
          gas_charge: gas,
          wifi_charge: wifi,
          generator_charge: generator,
          security_charge: security,
          other_charges: other,
          total_amount: total,
          status: "unpaid",
        };
      });

    let inserted = 0;
    if (newBills.length > 0) {
      const { error: insertErr } = await supabase.from("bills").insert(newBills);
      if (insertErr) throw insertErr;
      inserted = newBills.length;
    }

    return new Response(
      JSON.stringify({ success: true, month, generated: inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
