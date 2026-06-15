import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import Badge from "../components/Badge";
import ProgressBar from "../components/ProgressBar";
import { useAppData } from "../data/AppDataProvider";
import { Page } from "./Divisions";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { getCurrentUser } from "../utils/auth";

export default function JobdeskDetail() {
  const { id } = useParams();
  const user = getCurrentUser();
  const { tasks, divisionName, employeeName, loading, error, reload } = useAppData();
  const task = tasks.find((item) => String(item.id) === id);

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
            <Info label="Approval" value={<Badge>{task.approval}</Badge>} />
          </div>
          <div className="mt-5"><ProgressBar value={task.progress} /></div>
          <p className="mt-5 rounded bg-amber-50 px-4 py-3 text-sm text-amber-800">Catatan: {task.note}</p>
          {(task.submissionNote || task.submissionFileUrl) && (
            <div className="mt-5 rounded border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <p className="font-semibold">Submission Staff</p>
              {task.submissionNote && <p className="mt-1">{task.submissionNote}</p>}
              {task.submissionFileUrl && (
                <a className="mt-2 inline-flex font-semibold text-navy-700 hover:underline" href={task.submissionFileUrl} target="_blank" rel="noreferrer">
                  Lihat bukti: {task.submissionFileName || "File submission"}
                </a>
              )}
              {task.submittedAt && <p className="mt-2 text-xs text-emerald-700">Dikirim: {new Date(task.submittedAt).toLocaleString("id-ID")}</p>}
            </div>
          )}
        </section>
        <div className="space-y-4">
          <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <ProgressUpdate task={task} user={user} onSaved={reload} />
          </section>
          <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <SubmissionForm task={task} user={user} onSaved={reload} />
          </section>
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

function SubmissionForm({ task, user, onSaved }) {
  const [note, setNote] = useState(task.submissionNote || "");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const canSubmit = user?.role === "Staff" || String(user?.id) === String(task.assigneeId);

  async function submit(event) {
    event.preventDefault();
    setMessage("");

    if (!canSubmit) {
      setMessage("Hanya staff penerima tugas yang bisa mengirim submission.");
      return;
    }

    if (!isSupabaseConfigured) {
      setMessage("Koneksi data belum dikonfigurasi.");
      return;
    }

    if (!note.trim() && !file && !task.submissionFileUrl) {
      setMessage("Isi catatan atau upload file bukti pekerjaan.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMessage("Session login belum aktif. Silakan logout lalu login ulang.");
      return;
    }

    setSaving(true);
    let submissionFileUrl = task.submissionFileUrl || "";
    let submissionFileName = task.submissionFileName || "";

    if (file) {
      const extension = file.name.includes(".") ? file.name.split(".").pop() : "file";
      const path = `${task.id}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("task-submissions").upload(path, file, { upsert: true });

      if (uploadError) {
        setMessage(uploadError.message.includes("Bucket not found") ? "Bucket storage task-submissions belum dibuat. Jalankan SQL schema terbaru di Supabase." : uploadError.message);
        setSaving(false);
        return;
      }

      const { data } = supabase.storage.from("task-submissions").getPublicUrl(path);
      submissionFileUrl = data.publicUrl;
      submissionFileName = file.name;
    }

    const history = [
      ...(task.history || []),
      `${user?.name || "Staff"} mengirim hasil pekerjaan untuk approval${note ? ` - ${note}` : ""}`,
    ];

    const { error } = await supabase
      .from("tasks")
      .update({
        progress: 100,
        status: "Menunggu Approval",
        approval: "Menunggu Approval",
        submission_note: note,
        submission_file_url: submissionFileUrl,
        submission_file_name: submissionFileName,
        submitted_at: new Date().toISOString(),
        history,
      })
      .eq("id", task.id);

    if (error) {
      const isPolicyError = error.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? "Akses kirim submission belum aktif. Jalankan SQL write policy lalu login ulang." : error.message);
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || "Staff",
      division_id: task.divisionId,
      action: `mengirim hasil pekerjaan "${task.title}" untuk approval`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: "info",
    });

    setSaving(false);
    setFile(null);
    onSaved();
    setMessage("Submission berhasil dikirim dan menunggu approval.");
  }

  return (
    <form onSubmit={submit}>
      <h2 className="font-semibold text-slate-900">Kirim untuk Approval</h2>
      <div className="mt-4 space-y-4">
        {message && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{message}</div>}
        <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="Catatan hasil pekerjaan" value={note} onChange={(event) => setNote(event.target.value)} />
        <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        {task.submissionFileUrl && (
          <a className="text-sm font-semibold text-navy-700 hover:underline" href={task.submissionFileUrl} target="_blank" rel="noreferrer">
            File terkirim: {task.submissionFileName || "Bukti pekerjaan"}
          </a>
        )}
        <button disabled={saving || !canSubmit} className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
          {saving ? "Mengirim..." : "Kirim dan Tunggu Approval"}
        </button>
      </div>
    </form>
  );
}

function Info({ label, value }) {
  return <div className="rounded bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><div className="mt-1 text-sm font-semibold text-slate-800">{value}</div></div>;
}

function ProgressUpdate({ task, user, onSaved }) {
  const [progress, setProgress] = useState(task.progress || 0);
  const [status, setStatus] = useState(task.status || "Belum Mulai");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function handleProgressChange(value) {
    const nextProgress = Number(value);
    setProgress(nextProgress);
    if (nextProgress === 100) setStatus("Selesai");
    if (nextProgress > 0 && nextProgress < 100 && status === "Belum Mulai") setStatus("Proses");
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");

    if (!isSupabaseConfigured) {
      setMessage("Koneksi data belum dikonfigurasi.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMessage("Session login belum aktif. Silakan logout lalu login ulang.");
      return;
    }

    setSaving(true);
    const history = [
      ...(task.history || []),
      `${user?.name || "User"} mengubah progress menjadi ${progress}% (${status})${note ? ` - ${note}` : ""}`,
    ];

    const { error } = await supabase
      .from("tasks")
      .update({
        progress,
        status,
        note: note || task.note,
        history,
      })
      .eq("id", task.id);

    if (error) {
      const isPolicyError = error.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? "Akses update belum aktif. Jalankan SQL write policy lalu login ulang." : error.message);
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || "User",
      division_id: task.divisionId,
      action: `mengubah progress "${task.title}" menjadi ${progress}%`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: progress === 100 ? "success" : "info",
    });

    setSaving(false);
    setNote("");
    onSaved();
    setMessage("Progress berhasil disimpan.");
  }

  return (
    <form onSubmit={submit}>
      <h2 className="font-semibold text-slate-900">Update Progress</h2>
      <div className="mt-4 space-y-4">
        {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Progress</span>
            <span className="font-bold text-slate-900">{progress}%</span>
          </div>
          <input className="w-full accent-emerald-600" type="range" min="0" max="100" step="5" value={progress} onChange={(event) => handleProgressChange(event.target.value)} />
        </div>
        <select className="w-full rounded-lg border border-slate-200 px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option>Belum Mulai</option>
          <option>Proses</option>
          <option>Revisi</option>
          <option>Selesai</option>
          <option>Terlambat</option>
        </select>
        <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="Catatan update progress" value={note} onChange={(event) => setNote(event.target.value)} />
        <button disabled={saving} className="w-full rounded-lg bg-navy-800 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
          {saving ? "Menyimpan..." : "Simpan Progress"}
        </button>
      </div>
    </form>
  );
}
