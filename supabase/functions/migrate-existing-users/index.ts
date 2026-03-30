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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all profiles with real emails
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, email, phone")
      .neq("email", "");

    if (error || !profiles) {
      return new Response(JSON.stringify({ error: "Failed to fetch profiles" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];
    for (const profile of profiles) {
      if (!profile.email || profile.email.endsWith("@bariwala.app")) continue;

      // Update the auth user's email to the real email
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        profile.user_id,
        { email: profile.email, email_confirm: true }
      );

      results.push({
        user_id: profile.user_id,
        phone: profile.phone,
        email: profile.email,
        success: !updateError,
        error: updateError?.message || null,
      });
    }

    return new Response(JSON.stringify({ migrated: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Migration error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
