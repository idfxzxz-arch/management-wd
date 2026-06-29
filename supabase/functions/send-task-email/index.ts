import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { notificationId } = await request.json();
    if (!notificationId) {
      return json({ error: "notificationId wajib diisi." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const mailerSendApiKey = Deno.env.get("MAILERSEND_API_KEY") || Deno.env.get("MAILSENDER_API_KEY");
    const fromEmail = Deno.env.get("NOTIFICATION_FROM_EMAIL") || "WD Group <notifications@wdgroup.com>";

    if (!supabaseUrl || !serviceRoleKey || !mailerSendApiKey) {
      return json({ error: "Secret SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan MAILERSEND_API_KEY wajib tersedia." }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: notification, error: notificationError } = await supabase
      .from("task_email_notifications")
      .select("*")
      .eq("id", notificationId)
      .single();

    if (notificationError || !notification) {
      return json({ error: notificationError?.message || "Notifikasi tidak ditemukan." }, 404);
    }

    const sender = parseSender(fromEmail);
    const emailResponse = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mailerSendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: [{ email: notification.recipient_email, name: notification.recipient_name }],
        subject: notification.subject,
        text: notification.message,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      const errorMessage = normalizeMailerSendError(errorText);
      await supabase
        .from("task_email_notifications")
        .update({ status: "Failed", error_message: errorMessage })
        .eq("id", notificationId);
      return json({ error: errorMessage }, 502);
    }

    await supabase
      .from("task_email_notifications")
      .update({ status: "Sent", sent_at: new Date().toISOString(), error_message: null })
      .eq("id", notificationId);

    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message || "Gagal mengirim email." }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseSender(value: string) {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match) {
    return { name: match[1], email: match[2] };
  }

  return { email: value };
}

function normalizeMailerSendError(errorText: string) {
  try {
    const parsed = JSON.parse(errorText);
    if (parsed?.message === "Unauthenticated.") {
      return "MailerSend menolak API token (Unauthenticated). Buat API token MailerSend yang valid dan punya permission Email, lalu set ulang MAILERSEND_API_KEY.";
    }

    if (parsed?.message) {
      return parsed.message;
    }
  } catch {
    // Keep the raw provider response when it is not JSON.
  }

  return errorText || "MailerSend gagal mengirim email.";
}
