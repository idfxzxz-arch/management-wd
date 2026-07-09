import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import Badge from "../../components/Badge";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { getCurrentUser } from "../../utils/auth";
import { useAppData } from "../../data/AppDataProvider";
import { Page } from "../../components/PageShell";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

export default function MeetingAgenda() {
  const user = getCurrentUser();
  const { meetings, divisions, divisionName, scopedByDivision, loading, error, reload } = useAppData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deletingNow, setDeletingNow] = useState(false);
  const [message, setMessage] = useState("");
  const canManage = user?.role === "Owner" || user?.role === "Kepala Divisi" || user?.role === "Wakil Owner" || user?.role === "Developer";
  const rows = scopedByDivision(meetings, user);

  async function deleteMeeting() {
    if (!deleting || !canManage) return;
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

    setDeletingNow(true);
    const { error: deleteError } = await supabase.from("meetings").delete().eq("id", deleting.id);
    if (deleteError) {
      setMessage(deleteError.message.toLowerCase().includes("row-level security") ? "Role Anda tidak memiliki akses menghapus agenda ini." : deleteError.message);
      setDeletingNow(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || "User",
      division_id: deleting.divisionId,
      action: `menghapus agenda rapat "${deleting.topic}"`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: "warning",
    });

    setDeletingNow(false);
    setDeleting(null);
    setMessage("Agenda berhasil dihapus.");
    reload();
  }

  return (
    <Page
      title="Agenda Rapat"
      subtitle="Jadwal rapat mendatang, divisi, topik, peserta, dan status rapat."
      action={canManage && <button onClick={() => setOpen(true)} className="rounded bg-navy-800 px-4 py-2 text-sm font-semibold text-white">Tambah Agenda</button>}
    >
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      {message && <div className={`rounded-lg border p-4 text-sm ${message.includes("berhasil") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>}
      <DataTable
        rows={rows}
        columns={[
          { key: "date", header: "Tanggal" },
          { key: "time", header: "Jam" },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "topic", header: "Topik" },
          { key: "participants", header: "Peserta", render: (row) => row.participants.join(", ") },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
          ...(canManage ? [{ key: "actions", header: "Aksi", render: (row) => (
            <div className="flex gap-2">
              <button
                type="button"
                title="Edit agenda"
                aria-label={`Edit agenda ${row.topic}`}
                onClick={() => { setEditing(row); setMessage(""); }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                title="Hapus agenda"
                aria-label={`Hapus agenda ${row.topic}`}
                onClick={() => { setDeleting(row); setMessage(""); }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) }] : []),
        ]}
      />
      <Modal open={open} title="Tambah Agenda Rapat" onClose={() => setOpen(false)}>
        <MeetingForm divisions={divisions} user={user} onSaved={() => { setOpen(false); reload(); }} />
      </Modal>
      <Modal open={Boolean(editing)} title="Edit Agenda Rapat" onClose={() => setEditing(null)}>
        {editing && <MeetingForm meeting={editing} divisions={divisions} user={user} onSaved={() => { setEditing(null); setMessage("Agenda berhasil diperbarui."); reload(); }} />}
      </Modal>
      <Modal open={Boolean(deleting)} title="Hapus Agenda Rapat" onClose={() => !deletingNow && setDeleting(null)}>
        {deleting && (
          <div>
            <p className="text-sm leading-6 text-slate-600">Agenda <span className="font-semibold text-slate-900">{deleting.topic}</span> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" disabled={deletingNow} onClick={() => setDeleting(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">Batal</button>
              <button type="button" disabled={deletingNow} onClick={deleteMeeting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">{deletingNow ? "Menghapus..." : "Ya, Hapus"}</button>
            </div>
          </div>
        )}
      </Modal>
    </Page>
  );
}

function MeetingForm({ meeting = null, divisions, user, onSaved }) {
  const [form, setForm] = useState({
    date: meeting?.date || "",
    time: meeting?.time?.slice(0, 5) || "",
    divisionId: meeting?.divisionId || (user?.role === "Owner" || user?.role === "Wakil Owner" || user?.role === "Developer" ? "all" : user?.divisionId || "all"),
    topic: meeting?.topic || "",
    participants: meeting?.participants?.join(", ") || "",
    status: meeting?.status || "Terjadwal",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");

    if (!isSupabaseConfigured) {
      setMessage("Koneksi data belum dikonfigurasi.");
      return;
    }

    if (!form.date || !form.time || !form.topic.trim() || !form.participants.trim()) {
      setMessage("Lengkapi tanggal, jam, topik, dan peserta rapat.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMessage("Session login belum aktif. Silakan logout lalu login ulang.");
      return;
    }

    setSaving(true);
    const participants = form.participants.split(",").map((item) => item.trim()).filter(Boolean);
    const payload = {
      date: form.date,
      time: form.time,
      division_id: form.divisionId,
      topic: form.topic,
      participants,
      status: form.status,
    };
    const request = meeting
      ? supabase.from("meetings").update(payload).eq("id", meeting.id)
      : supabase.from("meetings").insert(payload);
    const { error } = await request;

    if (error) {
      const isPolicyError = error.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? `Role Anda tidak memiliki akses ${meeting ? "mengedit" : "menambah"} agenda ini.` : error.message);
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || "User",
      division_id: form.divisionId,
      action: `${meeting ? "memperbarui" : "menambahkan"} agenda rapat "${form.topic}"`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: user?.role === "Owner" || user?.role === "Wakil Owner" || user?.role === "Developer" ? "owner" : "info",
    });

    setSaving(false);
    onSaved();
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      {message && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{message}</div>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="form-field">
          <span className="form-label">Tanggal</span>
          <input className="form-control" type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} />
        </label>
        <label className="form-field">
          <span className="form-label">Waktu</span>
          <input className="form-control" type="time" value={form.time} onChange={(event) => updateField("time", event.target.value)} />
        </label>
      </div>
      <label className="form-field">
        <span className="form-label">Divisi</span>
        <select className="form-control" value={form.divisionId} onChange={(event) => updateField("divisionId", event.target.value)}>
          <option value="all">Semua Divisi</option>
          {divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
        </select>
      </label>
      <label className="form-field">
        <span className="form-label">Topik Rapat</span>
        <input className="form-control" placeholder="Topik rapat" value={form.topic} onChange={(event) => updateField("topic", event.target.value)} />
      </label>
      <label className="form-field">
        <span className="form-label">Peserta</span>
        <textarea className="form-control" placeholder="Peserta, pisahkan dengan koma" value={form.participants} onChange={(event) => updateField("participants", event.target.value)} />
      </label>
      <label className="form-field">
        <span className="form-label">Status</span>
        <select className="form-control" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
          <option>Terjadwal</option>
          <option>Menunggu Konfirmasi</option>
          <option>Selesai</option>
          <option>Dibatalkan</option>
        </select>
      </label>
      <div className="form-actions">
        <button disabled={saving} className="primary-action w-full sm:w-auto">
          {saving ? "Menyimpan..." : meeting ? "Simpan Perubahan" : "Simpan Agenda"}
        </button>
      </div>
    </form>
  );
}
