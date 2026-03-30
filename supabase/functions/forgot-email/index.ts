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
    const { phone, date_of_birth } = await req.json();

    if (!phone || !date_of_birth) {
      return new Response(
        JSON.stringify({ error: "Phone and date of birth are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("phone", phone.trim())
      .eq("date_of_birth", date_of_birth)
      .maybeSingle();

    if (error || !data || !data.email) {
      return new Response(
        JSON.stringify({ error: "No account found matching this phone number and date of birth" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mask email for security: show first 2 chars + ***@domain
    const emailParts = data.email.split("@");
    const maskedEmail = emailParts[0].substring(0, 2) + "***@" + emailParts[1];

    return new Response(
      JSON.stringify({ email: data.email, maskedEmail, fullName: data.full_name }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
