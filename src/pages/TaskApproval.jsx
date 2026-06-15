import { useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { getCurrentUser } from "../utils/auth";
import { useAppData } from "../data/AppDataProvider";
import { Page } from "./Divisions";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export default function TaskApproval() {
  const user = getCurrentUser();
  const { tasks, divisionName, employeeName, scopedByDivision, loading, error, reload } = useAppData();
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");
  const [revisionTask, setRevisionTask] = useState(null);
  const [revisionNote, setRevisionNote] = useState("");
  const rows = scopedByDivision(tasks, user).filter((task) => task.approval === "Menunggu Approval");

  async function updateApproval(task, approval, customNote = "") {
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

    setSavingId(task.id);
    const nextStatus = approval === "Approved" && task.progress === 100 ? "Selesai" : approval === "Revisi" ? "Revisi" : task.status;
    const nextNote = approval === "Revisi" ? customNote || "Perlu revisi dari approver." : task.note;
    const history = [
      ...(task.history || []),
      `${user?.name || "User"} ${approval === "Approved" ? "approve" : "meminta revisi"} tugas${approval === "Revisi" && nextNote ? ` - ${nextNote}` : ""}`,
    ];

    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        approval,
        status: nextStatus,
        note: nextNote,
        approved_at: approval === "Approved" ? new Date().toISOString() : null,
        approved_by: approval === "Approved" ? user?.name || "User" : null,
        history,
      })
      .eq("id", task.id);

    if (updateError) {
      const isPolicyError = updateError.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? "Akses approval belum aktif. Jalankan SQL write policy lalu login ulang." : updateError.message);
      setSavingId(null);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || "User",
      division_id: task.divisionId,
      action: `${approval === "Approved" ? "approve" : "meminta revisi"} tugas "${task.title}"`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: approval === "Approved" ? "success" : "warning",
    });

    setSavingId(null);
    setRevisionTask(null);
    setRevisionNote("");
    setMessage(`Tugas berhasil di${approval === "Approved" ? "approve" : "revisi"}.`);
    reload();
  }

  function requestRevision(event) {
    event.preventDefault();
    if (!revisionTask) return;
    if (!revisionNote.trim()) {
      setMessage("Catatan revisi wajib diisi.");
      return;
    }
    updateApproval(revisionTask, "Revisi", revisionNote.trim());
  }

  return (
    <Page title="Approval Tugas" subtitle="Daftar tugas yang menunggu approval, approve, dan revisi.">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
      <DataTable
        rows={rows}
        columns={[
          { key: "title", header: "Tugas" },
          { key: "assigneeId", header: "Staff", render: (row) => employeeName(row.assigneeId) },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "assignedBy", header: "Dari", render: (row) => <Badge>{row.assignedBy}</Badge> },
          { key: "approval", header: "Status Approval", render: (row) => <Badge>{row.approval}</Badge> },
          { key: "submissionNote", header: "Catatan Staff", render: (row) => <span className="block max-w-sm whitespace-normal">{row.submissionNote || "-"}</span> },
          { key: "submissionFileUrl", header: "Bukti", render: (row) => row.submissionFileUrl ? <a className="font-semibold text-navy-700 hover:underline" href={row.submissionFileUrl} target="_blank" rel="noreferrer">{row.submissionFileName || "Lihat file"}</a> : "-" },
          { key: "note", header: "Catatan Revisi", render: (row) => <span className="block max-w-sm whitespace-normal">{row.note}</span> },
          { key: "actions", header: "Aksi", render: (row) => (
            <div className="flex gap-2">
              <button disabled={savingId === row.id} onClick={() => updateApproval(row, "Approved")} className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">Approve</button>
              <button disabled={savingId === row.id} onClick={() => { setRevisionTask(row); setRevisionNote(row.note || ""); setMessage(""); }} className="rounded bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">Revisi</button>
            </div>
          ) },
        ]}
      />
      <Modal open={Boolean(revisionTask)} title="Catatan Revisi" onClose={() => { setRevisionTask(null); setRevisionNote(""); }}>
        <form className="grid gap-3" onSubmit={requestRevision}>
          <textarea className="min-h-[120px] rounded-lg border border-slate-200 px-3 py-2" placeholder="Tulis catatan revisi untuk staff" value={revisionNote} onChange={(event) => setRevisionNote(event.target.value)} />
          <button disabled={savingId === revisionTask?.id} className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
            {savingId === revisionTask?.id ? "Mengirim..." : "Kirim Revisi"}
          </button>
        </form>
      </Modal>
    </Page>
  );
}
