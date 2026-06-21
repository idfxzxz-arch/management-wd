import { useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { getCurrentUser } from "../utils/auth";
import { useAppData } from "../data/AppDataProvider";
import { Page } from "./Divisions";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export default function MeetingAgenda() {
  const user = getCurrentUser();
  const { meetings, divisions, divisionName, scopedByDivision, loading, error, reload } = useAppData();
  const [open, setOpen] = useState(false);
  const canManage = user?.role === "Owner" || user?.role === "Kepala Divisi" || user?.role === "Administrator";
  const rows = scopedByDivision(meetings, user);

  return (
    <Page
      title="Agenda Rapat"
      subtitle="Jadwal rapat mendatang, divisi, topik, peserta, dan status rapat."
      action={canManage && <button onClick={() => setOpen(true)} className="rounded bg-navy-800 px-4 py-2 text-sm font-semibold text-white">Tambah Agenda</button>}
    >
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      <DataTable
        rows={rows}
        columns={[
          { key: "date", header: "Tanggal" },
          { key: "time", header: "Jam" },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "topic", header: "Topik" },
          { key: "participants", header: "Peserta", render: (row) => row.participants.join(", ") },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
        ]}
      />
      <Modal open={open} title="Tambah Agenda Rapat" onClose={() => setOpen(false)}>
        <MeetingForm divisions={divisions} user={user} onSaved={() => { setOpen(false); reload(); }} />
      </Modal>
    </Page>
  );
}

function MeetingForm({ divisions, user, onSaved }) {
  const [form, setForm] = useState({
    date: "",
    time: "",
    divisionId: user?.role === "Owner" || user?.role === "Administrator" ? "all" : user?.divisionId || "all",
    topic: "",
    participants: "",
    status: "Terjadwal",
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
    const { error } = await supabase.from("meetings").insert({
      date: form.date,
      time: form.time,
      division_id: form.divisionId,
      topic: form.topic,
      participants,
      status: form.status,
    });

    if (error) {
      const isPolicyError = error.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? "Akses ditolak oleh policy role. Pastikan migrasi supabase-role-policies.sql sudah dijalankan." : error.message);
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || "User",
      division_id: form.divisionId,
      action: `menambahkan agenda rapat "${form.topic}"`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: user?.role === "Owner" || user?.role === "Administrator" ? "owner" : "info",
    });

    setSaving(false);
    onSaved();
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      {message && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{message}</div>}
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="rounded border border-slate-200 px-3 py-2" type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} />
        <input className="rounded border border-slate-200 px-3 py-2" type="time" value={form.time} onChange={(event) => updateField("time", event.target.value)} />
      </div>
      <select className="rounded border border-slate-200 px-3 py-2" value={form.divisionId} onChange={(event) => updateField("divisionId", event.target.value)}>
        <option value="all">Semua Divisi</option>
        {divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
      </select>
      <input className="rounded border border-slate-200 px-3 py-2" placeholder="Topik rapat" value={form.topic} onChange={(event) => updateField("topic", event.target.value)} />
      <textarea className="rounded border border-slate-200 px-3 py-2" placeholder="Peserta, pisahkan dengan koma" value={form.participants} onChange={(event) => updateField("participants", event.target.value)} />
      <select className="rounded border border-slate-200 px-3 py-2" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
        <option>Terjadwal</option>
        <option>Menunggu Konfirmasi</option>
        <option>Selesai</option>
        <option>Dibatalkan</option>
      </select>
      <button disabled={saving} className="rounded bg-navy-800 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
        {saving ? "Menyimpan..." : "Simpan Agenda"}
      </button>
    </form>
  );
}
