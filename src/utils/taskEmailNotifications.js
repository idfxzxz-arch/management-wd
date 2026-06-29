import { supabase, isSupabaseConfigured } from "../lib/supabase";

export async function queueTaskEmailNotification({ task, assignee, actorName, divisionName }) {
  if (!isSupabaseConfigured) return { queued: false, sent: false, error: "Koneksi Supabase belum dikonfigurasi." };
  if (!task?.id || !assignee?.email) return { queued: false, sent: false, error: "Data tugas atau email penerima belum lengkap." };

  const subject = `Jobdesk baru: ${task.title}`;
  const message = [
    `Halo ${assignee.name},`,
    "",
    `${actorName} memberi jobdesk baru untuk Anda.`,
    `Judul: ${task.title}`,
    `Divisi: ${divisionName || task.divisionId}`,
    `Deadline: ${task.deadline || "-"}`,
    "",
    "Silakan login ke WD Group Internal Management System untuk melihat detail tugas.",
  ].join("\n");

  const { data: notification, error } = await supabase
    .from("task_email_notifications")
    .insert({
      task_id: task.id,
      recipient_employee_id: assignee.id,
      recipient_name: assignee.name,
      recipient_email: assignee.email,
      subject,
      message,
      status: "Queued",
    })
    .select("id")
    .single();

  if (error || !notification?.id) {
    return { queued: false, sent: false, error: error?.message || "Gagal membuat antrean email." };
  }

  try {
    const { data: functionData, error: functionError } = await supabase.functions.invoke("send-task-email", {
      body: { notificationId: notification.id },
    });

    if (functionError) {
      const message = normalizeFunctionError(functionData?.error || functionError.message);
      const storedError = await readNotificationError(notification.id);
      if (!storedError) {
        await markNotificationFailed(notification.id, message);
      }
      return { queued: true, sent: false, error: storedError || message };
    }

    return { queued: true, sent: true, error: "" };
  } catch (invokeError) {
    const message = normalizeFunctionError(invokeError.message);
    await markNotificationFailed(notification.id, message);
    return { queued: true, sent: false, error: message };
  }
}

function normalizeFunctionError(message = "") {
  if (message.includes("Failed to send a request")) {
    return "Edge Function send-task-email belum bisa dijangkau. Biasanya function belum dideploy ke Supabase, project ref/env salah, atau koneksi/CORS terblokir.";
  }

  return message || "Email function belum aktif.";
}

async function markNotificationFailed(id, message) {
  await supabase
    .from("task_email_notifications")
    .update({
      status: "Failed",
      error_message: message || "Email function belum aktif.",
    })
    .eq("id", id);
}

async function readNotificationError(id) {
  const { data } = await supabase
    .from("task_email_notifications")
    .select("error_message")
    .eq("id", id)
    .single();

  return data?.error_message || "";
}
