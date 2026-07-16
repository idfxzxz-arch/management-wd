import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { ExternalLink, FolderOpen } from "lucide-react";
import Badge from "../../components/Badge";
import ProgressBar from "../../components/ProgressBar";
import { useAppData } from "../../data/AppDataProvider";
import { Page } from "../../components/PageShell";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { getCurrentUser } from "../../utils/auth";
import { buildSubmissionRows } from "../../utils/submissions";
import { isManagementRole, isStaffLike } from "../../utils/helpers";

export default function JobdeskDetail() {
  const { id } = useParams();
  const user = getCurrentUser();
  const { tasks, taskSubmissions, employees, divisionName, employeeName, scopedByDivision, loading, error, reload } = useAppData();
  const visibleTasks = scopedByDivision(tasks, user);
  const task = visibleTasks.find((item) => String(item.id) === id);
  const employeeRole = (employeeId) => employees.find((employee) => String(employee.id) === String(employeeId))?.role || "Staff";
  const submissionRow = task ? buildSubmissionRows([task], taskSubmissions, { employeeName, employeeRole })[0] : null;
  const canEditTask = !isStaffLike(user?.role);
  const isCurrentAssignee = task && String(user?.employeeId) === String(task.assigneeId);

  if (loading) return <Page title="Detail Jobdesk"><p className="text-slate-500">Memuat data...</p></Page>;
  if (error) return <Page title="Detail Jobdesk"><p className="text-amber-700">{error}</p></Page>;
  if (!task) return <Page title="Detail Jobdesk"><p className="text-slate-500">Tugas tidak ditemukan.</p></Page>;

  return (
    <Page title="Detail Jobdesk" subtitle={task.title} action={<Link className="rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700" to="/individual-jobdesk">Kembali</Link>}>
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{task.title}</h2>
          <p className="mt-2 text-slate-600">{task.description}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Info label="Penanggung Jawab" value={employeeName(task.assigneeId)} />
            <Info label="Divisi" value={divisionName(task.divisionId)} />
            <Info label="Sumber Tugas" value={<Badge>{task.assignedBy}</Badge>} />
            <Info label="Pemberi Tugas" value={task.assignedByName} />
            <Info label="Deadline" value={task.deadline} />
            <Info label="Prioritas" value={<Badge>{task.priority}</Badge>} />
            <Info label="Status" value={<Badge>{task.status}</Badge>} />
            <Info label="Status Review" value={<Badge>{submissionRow?.status || task.approval}</Badge>} />
          </div>
          <div className="mt-5"><ProgressBar value={task.progress} /></div>
          <p className="mt-5 rounded bg-amber-50 px-4 py-3 text-sm text-amber-800">Catatan: {task.note}</p>
          {(submissionRow?.submissionNote || submissionRow?.driveLink) && (
            <div className="mt-5 rounded border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <p className="font-semibold">Pengumpulan PIC</p>
              {submissionRow.submissionNote && <p className="mt-1">{submissionRow.submissionNote}</p>}
              {submissionRow.driveLink && !isManagementRole(user?.role) && (
                <a className="mt-2 inline-flex font-semibold text-navy-700 hover:underline" href={submissionRow.driveLink} target="_blank" rel="noreferrer">
                  Buka link Google Drive
                </a>
              )}
              {submissionRow.submittedAt && <p className="mt-2 text-xs text-emerald-700">Dikirim: {new Date(submissionRow.submittedAt).toLocaleString("id-ID")}</p>}
              {submissionRow.headFeedback && <p className="mt-2 rounded bg-white/70 px-3 py-2 text-emerald-900">Feedback: {submissionRow.headFeedback}</p>}
            </div>
          )}
        </section>
        <div className="space-y-4">
          {isCurrentAssignee ? (
            <>
              <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
                <ProgressUpdate task={task} submission={submissionRow} user={user} onSaved={reload} />
              </section>
              <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
                <SubmissionForm task={task} submission={submissionRow} user={user} employeeName={employeeName} employeeRole={employeeRole} onSaved={reload} />
              </section>
            </>
          ) : (
            <DriveAccess submission={submissionRow} />
          )}
          <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Riwayat Update</h2>
            <div className="mt-4 space-y-3">
              {(task.history || []).map((item, index) => (
                <div key={`${item}-${index}`} className="flex gap-3 rounded border border-slate-100 p-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-navy-50 text-sm font-bold text-navy-700">{index + 1}</span>
                  <p className="text-sm text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Page>
  );
}

function DriveAccess({ submission }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        <FolderOpen size={22} />
      </div>
      <h2 className="mt-4 font-semibold text-slate-900">Hasil Pekerjaan PIC</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        Buka folder Google Drive untuk melihat file yang telah dikumpulkan.
      </p>
      {submission?.driveLink ? (
        <a
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-900"
          href={submission.driveLink}
          target="_blank"
          rel="noreferrer"
        >
          Buka Google Drive
          <ExternalLink size={17} />
        </a>
      ) : (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          PIC belum mengirimkan link Google Drive.
        </div>
      )}
      {submission?.submittedAt && (
        <p className="mt-3 text-xs text-slate-400">
          Dikirim {new Date(submission.submittedAt).toLocaleString("id-ID")}
        </p>
      )}
    </section>
  );
}

function SubmissionForm({ task, submission, user, employeeName, employeeRole, onSaved }) {
  const [note, setNote] = useState(submission?.submissionNote || "");
  const [driveLink, setDriveLink] = useState(submission?.driveLink || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const isAssignee = String(user?.employeeId) === String(task.assigneeId);
  const canSubmit = isAssignee && (!submission?.status || ["Belum Dikumpulkan", "Revisi", "Terlambat"].includes(submission.status));
  const alreadySubmitted = submission?.status === "Menunggu Review" || submission?.status === "Revisi Dikirim Ulang";
  const approved = submission?.status === "Diterima";

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setSuccess("");

    if (!canSubmit) {
      setMessage(approved ? "Tugas sudah diterima dan tidak bisa dikirim ulang." : "Hanya penerima tugas yang bisa mengumpulkan tugas.");
      return;
    }

    if (!isSupabaseConfigured) {
      setMessage("Koneksi data belum dikonfigurasi.");
      return;
    }

    if (!driveLink.trim()) {
      setMessage("Link Google Drive wajib diisi.");
      return;
    }

    let driveUrl;
    try {
      driveUrl = new URL(driveLink.trim());
    } catch {
      setMessage("Format link Google Drive tidak valid.");
      return;
    }
    if (driveUrl.protocol !== "https:" || !["drive.google.com", "docs.google.com"].includes(driveUrl.hostname)) {
      setMessage("Gunakan link resmi Google Drive atau Google Docs dengan HTTPS.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMessage("Session login belum aktif. Silakan logout lalu login ulang.");
      return;
    }

    setSaving(true);
    const submittedAt = new Date().toISOString();
    const resubmittingRevision = submission?.status === "Revisi";
    const revisionHistory = resubmittingRevision
      ? [
          ...(submission.revisionHistory || []),
          {
            oldLink: submission.driveLink,
            newLink: driveLink.trim(),
            note: note.trim(),
            sentAt: submittedAt,
            feedback: submission.headFeedback || "",
          },
        ]
      : submission?.revisionHistory || [];
    const nextStatus = resubmittingRevision ? "Revisi Dikirim Ulang" : "Menunggu Review";

    const history = [
      ...(task.history || []),
      `${user?.name || "Staff"} ${resubmittingRevision ? "mengirim ulang revisi" : "mengumpulkan tugas"} via Google Drive${note ? ` - ${note}` : ""}`,
    ];

    const submissionPayload = {
      task_id: task.id,
      task_title: task.title,
      task_description: task.description,
      staff_name: employeeName(task.assigneeId),
      staff_role: employeeRole(task.assigneeId) === "Magang" ? "Anak Magang" : employeeRole(task.assigneeId),
      division_id: task.divisionId,
      deadline: task.deadline,
      drive_link: driveLink.trim(),
      submission_note: note.trim(),
      submitted_at: submittedAt,
      status: nextStatus,
      head_feedback: resubmittingRevision ? "" : submission?.headFeedback || "",
      reviewed_at: null,
      reviewed_by: null,
      reviewer_role: null,
      revision_count: submission?.revisionCount || 0,
      revision_history: revisionHistory,
    };

    const { error: submissionError } = await supabase
      .from("task_submissions")
      .upsert(submissionPayload, { onConflict: "task_id" });

    if (submissionError) {
      setMessage(submissionError.message);
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("tasks")
      .update({
        status: nextStatus,
        approval: "Menunggu Review",
        submission_note: note.trim(),
        submission_file_url: driveLink.trim(),
        submission_file_name: "Google Drive",
        submitted_at: submittedAt,
        history,
      })
      .eq("id", task.id);

    if (error) {
      const isPolicyError = error.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? "Anda hanya dapat mengirim tugas yang ditugaskan kepada akun ini." : error.message);
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || "Staff",
      division_id: task.divisionId,
      action: `${resubmittingRevision ? "mengirim ulang revisi" : "mengumpulkan tugas"} "${task.title}" melalui Google Drive`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: "info",
    });

    setSaving(false);
    onSaved();
    setSuccess(resubmittingRevision ? "Revisi berhasil dikirim ulang dan menunggu review." : "Tugas berhasil dikumpulkan dan menunggu review.");
  }

  return (
    <form onSubmit={submit}>
      <h2 className="font-semibold text-slate-900">Kumpulkan Tugas</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">Kirim link hasil pekerjaan untuk direview. Progres tidak otomatis menjadi 100%.</p>
      <div className="mt-4 space-y-4">
        {message && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</div>}
        {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}
        {alreadySubmitted && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">Status: Menunggu Review.</div>}
        {approved && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Status: Diterima. Pengiriman ulang ditutup.</div>}
        <label className="form-field">
          <span className="form-label">Link Google Drive</span>
          <input className="form-control text-sm" placeholder="https://drive.google.com/..." value={driveLink} onChange={(event) => setDriveLink(event.target.value)} disabled={!canSubmit} />
        </label>
        <label className="form-field">
          <span className="form-label">Catatan Pengumpulan</span>
          <textarea className="form-control" placeholder="Catatan pengumpulan" value={note} onChange={(event) => setNote(event.target.value)} disabled={!canSubmit} />
        </label>
        {submission?.driveLink && (
          <a className="text-sm font-semibold text-navy-700 hover:underline" href={submission.driveLink} target="_blank" rel="noreferrer">
            Link terkirim: Google Drive
          </a>
        )}
        <button disabled={saving || !canSubmit} className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
          {saving ? "Mengirim..." : submission?.status === "Revisi" ? "Submit Ulang Revisi" : "Submit Tugas"}
        </button>
      </div>
    </form>
  );
}

function Info({ label, value }) {
  return <div className="rounded bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><div className="mt-1 text-sm font-semibold text-slate-800">{value}</div></div>;
}

function ProgressUpdate({ task, submission, user, onSaved }) {
  const [progress, setProgress] = useState(Math.min(task.progress || 0, 95));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const isAssignee = String(user?.employeeId) === String(task.assigneeId);
  const reviewLocked = ["Menunggu Review", "Revisi Dikirim Ulang", "Diterima"].includes(submission?.status);
  const canUpdate = isAssignee && !reviewLocked;

  async function submit(event) {
    event.preventDefault();
    setMessage("");

    if (!isSupabaseConfigured) {
      setMessage("Koneksi data belum dikonfigurasi.");
      return;
    }

    if (!canUpdate) {
      setMessage("Progress dikunci selama tugas sedang direview.");
      return;
    }

    const nextStatus = task.status === "Terlambat" ? "Terlambat" : progress > 0 ? "Proses" : "Belum Mulai";

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMessage("Session login belum aktif. Silakan logout lalu login ulang.");
      return;
    }

    setSaving(true);
    const history = [
      ...(task.history || []),
      `${user?.name || "Staf"} mengubah progress menjadi ${progress}% (${nextStatus})${note ? ` - ${note}` : ""}`,
    ];

    const { error } = await supabase
      .from("tasks")
      .update({
        progress,
        status: nextStatus,
        note: note || task.note,
        history,
      })
      .eq("id", task.id);

    if (error) {
      const isPolicyError = error.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? "Anda hanya dapat memperbarui progres tugas milik sendiri." : error.message);
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || "Staf",
      division_id: task.divisionId,
      action: `mengubah progress "${task.title}" menjadi ${progress}%`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: "info",
    });

    setSaving(false);
    setNote("");
    onSaved();
    setMessage("Progress berhasil disimpan.");
  }

  return (
    <form onSubmit={submit}>
      <h2 className="font-semibold text-slate-900">Update Progress</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">Perbarui progres pengerjaan. Nilai 100% diberikan otomatis setelah tugas disetujui reviewer.</p>
      <div className="mt-4 space-y-4">
        {message && <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">{message}</div>}
        {reviewLocked && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">Progress dikunci karena tugas sedang direview.</div>}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Progress</span>
            <span className="font-bold text-slate-900">{progress}%</span>
          </div>
          <input disabled={!canUpdate} className="w-full accent-emerald-600 disabled:cursor-not-allowed disabled:opacity-60" type="range" min="0" max="95" step="5" value={progress} onChange={(event) => setProgress(Number(event.target.value))} />
        </div>
        <label className="form-field">
          <span className="form-label">Catatan Progress</span>
          <textarea disabled={!canUpdate} className="form-control" placeholder="Catatan update progress" value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
        <button disabled={saving || !canUpdate} className="w-full rounded-lg bg-navy-800 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
          {saving ? "Menyimpan..." : "Simpan Progress"}
        </button>
      </div>
    </form>
  );
}
