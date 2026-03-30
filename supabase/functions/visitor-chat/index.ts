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

    const body = await req.json();
    const { action } = body;

    if (action === "start") {
      const { visitor_name, visitor_phone, landlord_id, room_id } = body;
      if (!visitor_name || !visitor_phone || !landlord_id) {
        return new Response(
          JSON.stringify({ error: "visitor_name, visitor_phone, and landlord_id are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate phone format (basic)
      const phone = visitor_phone.trim();
      if (phone.length < 10 || phone.length > 15) {
        return new Response(
          JSON.stringify({ error: "Invalid phone number" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if conversation already exists for this visitor + landlord + room
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("landlord_id", landlord_id)
        .eq("visitor_phone", phone)
        .eq("room_id", room_id || null)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ conversation_id: existing.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert({
          landlord_id,
          visitor_name: visitor_name.trim().substring(0, 100),
          visitor_phone: phone,
          room_id: room_id || null,
        })
        .select("id")
        .single();

      if (convError) throw convError;

      return new Response(
        JSON.stringify({ conversation_id: conv.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "send") {
      const { conversation_id, content } = body;
      if (!conversation_id || !content?.trim()) {
        return new Response(
          JSON.stringify({ error: "conversation_id and content are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify conversation exists and is a visitor conversation
      const { data: conv } = await supabase
        .from("conversations")
        .select("id, visitor_phone")
        .eq("id", conversation_id)
        .single();

      if (!conv || !conv.visitor_phone) {
        return new Response(
          JSON.stringify({ error: "Invalid visitor conversation" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: msg, error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id,
          sender_type: "visitor",
          sender_id: null,
          content: content.trim().substring(0, 2000),
        })
        .select("id, content, created_at")
        .single();

      if (msgError) throw msgError;

      return new Response(
        JSON.stringify(msg),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "fetch") {
      const { conversation_id } = body;
      if (!conversation_id) {
        return new Response(
          JSON.stringify({ error: "conversation_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: msgs, error } = await supabase
        .from("messages")
        .select("id, content, sender_type, sender_id, is_read, created_at")
        .eq("conversation_id", conversation_id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify(msgs || []),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'start', 'send', or 'fetch'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
