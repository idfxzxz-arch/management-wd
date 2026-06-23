import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { getCurrentUser } from "../utils/auth";
import { contains } from "../utils/helpers";
import { Page, Search } from "./Divisions";
import { useAppData } from "../data/AppDataProvider";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export default function Minutes() {
  const user = getCurrentUser();
  const { minutes, divisions, divisionName, scopedByDivision, loading, error, reload } = useAppData();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deletingNow, setDeletingNow] = useState(false);
  const [message, setMessage] = useState("");
  const canManage = user?.role === "Owner" || user?.role === "Kepala Divisi" || user?.role === "Wakil Owner";
  const rows = useMemo(() => scopedByDivision(minutes, user).filter((item) => contains(Object.values(item).join(" "), query)), [query, user]);

  async function deleteMinute() {
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
    const { error: deleteError } = await supabase.from("minutes").delete().eq("id", deleting.id);
    if (deleteError) {
      setMessage(deleteError.message.toLowerCase().includes("row-level security") ? "Role Anda tidak memiliki akses menghapus notulen ini." : deleteError.message);
      setDeletingNow(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || "User",
      division_id: deleting.divisionId,
      action: `menghapus notulen rapat "${deleting.title}"`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: "warning",
    });
    setDeletingNow(false);
    setDeleting(null);
    setMessage("Notulen berhasil dihapus.");
    reload();
  }

  return (
    <Page
      title="Notulen Rapat"
      subtitle="Judul, tanggal, pemimpin, peserta, pembahasan, keputusan, dan tindak lanjut."
      action={canManage && <button onClick={() => setOpen(true)} className="rounded bg-navy-800 px-4 py-2 text-sm font-semibold text-white">Tambah Notulen</button>}
    >
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      {message && <div className={`rounded-lg border p-4 text-sm ${message.includes("berhasil") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>}
      <Search value={query} setValue={setQuery} placeholder="Cari notulen rapat" />
      <DataTable
        rows={rows}
        columns={[
          { key: "title", header: "Judul Rapat", render: (row) => <Link className="font-semibold text-navy-700 hover:underline" to={`/minutes/${row.id}`}>{row.title}</Link> },
          { key: "date", header: "Tanggal" },
          { key: "time", header: "Waktu" },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "leader", header: "Pemimpin" },
          { key: "participants", header: "Peserta", render: (row) => row.participants.join(", ") },
          { key: "decision", header: "Keputusan", render: (row) => <span className="block max-w-md whitespace-normal">{row.decision}</span> },
          { key: "followUp", header: "Tindak Lanjut", render: (row) => <span className="block max-w-md whitespace-normal">{row.followUp}</span> },
          ...(canManage ? [{ key: "actions", header: "Aksi", render: (row) => (
            <div className="flex gap-2">
              <button
                type="button"
                title="Edit notulen"
                aria-label={`Edit notulen ${row.title}`}
                onClick={() => { setEditing(row); setMessage(""); }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                title="Hapus notulen"
                aria-label={`Hapus notulen ${row.title}`}
                onClick={() => { setDeleting(row); setMessage(""); }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) }] : []),
        ]}
      />
      <Modal open={open} title="Tambah Notulen Rapat" onClose={() => setOpen(false)}>
        <MinuteForm divisions={divisions} user={user} onSaved={() => { setOpen(false); reload(); }} />
      </Modal>
      <Modal open={Boolean(editing)} title="Edit Notulen Rapat" onClose={() => setEditing(null)}>
        {editing && <MinuteForm minute={editing} divisions={divisions} user={user} onSaved={() => { setEditing(null); setMessage("Notulen berhasil diperbarui."); reload(); }} />}
      </Modal>
      <Modal open={Boolean(deleting)} title="Hapus Notulen" onClose={() => !deletingNow && setDeleting(null)}>
        {deleting && (
          <div>
            <p className="text-sm leading-6 text-slate-600">Notulen <span className="font-semibold text-slate-900">{deleting.title}</span> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button disabled={deletingNow} onClick={() => setDeleting(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">Batal</button>
              <button disabled={deletingNow} onClick={deleteMinute} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">{deletingNow ? "Menghapus..." : "Ya, Hapus"}</button>
            </div>
          </div>
        )}
      </Modal>
    </Page>
  );
}

function MinuteForm({ minute = null, divisions, user, onSaved }) {
  const [form, setForm] = useState({
    title: minute?.title || "",
    date: minute?.date || "",
    time: minute?.time?.slice(0, 5) || "",
    divisionId: minute?.divisionId || (user?.role === "Owner" || user?.role === "Wakil Owner" ? "all" : user?.divisionId || "all"),
    leader: minute?.leader || user?.name || "",
    participants: minute?.participants?.join(", ") || "",
    discussion: minute?.discussion || "",
    decision: minute?.decision || "",
    followUp: minute?.followUp || "",
    actionDeadline: minute?.actionDeadline || "",
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

    if (!form.title.trim() || !form.date || !form.time || !form.leader.trim() || !form.participants.trim() || !form.discussion.trim()) {
      setMessage("Lengkapi judul, tanggal, waktu, pemimpin, peserta, dan pembahasan.");
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
      title: form.title,
      date: form.date,
      time: form.time,
      division_id: form.divisionId,
      leader: form.leader,
      participants,
      discussion: form.discussion,
      decision: form.decision,
      follow_up: form.followUp,
      action_deadline: form.actionDeadline || null,
    };
    const request = minute
      ? supabase.from("minutes").update(payload).eq("id", minute.id)
      : supabase.from("minutes").insert(payload);
    const { error } = await request;

    if (error) {
      const isPolicyError = error.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? `Role Anda tidak memiliki akses ${minute ? "mengedit" : "menambah"} notulen ini.` : error.message);
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || "User",
      division_id: form.divisionId,
      action: `${minute ? "memperbarui" : "menambahkan"} notulen rapat "${form.title}"`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: user?.role === "Owner" || user?.role === "Wakil Owner" ? "owner" : "info",
    });

    setSaving(false);
    onSaved();
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      {message && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{message}</div>}
      <input className="rounded border border-slate-200 px-3 py-2" placeholder="Judul rapat" value={form.title} onChange={(event) => updateField("title", event.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="rounded border border-slate-200 px-3 py-2" type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} />
        <input className="rounded border border-slate-200 px-3 py-2" type="time" value={form.time} onChange={(event) => updateField("time", event.target.value)} />
      </div>
      <select disabled={user?.role === "Kepala Divisi" && user?.divisionId !== "all"} className="rounded border border-slate-200 px-3 py-2 disabled:bg-slate-100" value={form.divisionId} onChange={(event) => updateField("divisionId", event.target.value)}>
        <option value="all">Semua Divisi</option>
        {divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
      </select>
      <input className="rounded border border-slate-200 px-3 py-2" placeholder="Pemimpin rapat" value={form.leader} onChange={(event) => updateField("leader", event.target.value)} />
      <textarea className="rounded border border-slate-200 px-3 py-2" placeholder="Peserta, pisahkan dengan koma" value={form.participants} onChange={(event) => updateField("participants", event.target.value)} />
      <textarea className="rounded border border-slate-200 px-3 py-2" placeholder="Isi pembahasan" value={form.discussion} onChange={(event) => updateField("discussion", event.target.value)} />
      <textarea className="rounded border border-slate-200 px-3 py-2" placeholder="Keputusan rapat" value={form.decision} onChange={(event) => updateField("decision", event.target.value)} />
      <textarea className="rounded border border-slate-200 px-3 py-2" placeholder="Tindak lanjut / action plan" value={form.followUp} onChange={(event) => updateField("followUp", event.target.value)} />
      <input className="rounded border border-slate-200 px-3 py-2" type="date" value={form.actionDeadline} onChange={(event) => updateField("actionDeadline", event.target.value)} />
      <button disabled={saving} className="rounded bg-navy-800 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
        {saving ? "Menyimpan..." : minute ? "Simpan Perubahan" : "Simpan Notulen"}
      </button>
    </form>
  );
}
