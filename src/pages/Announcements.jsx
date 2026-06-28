import { useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { getCurrentUser } from "../utils/auth";
import { Page } from "./Divisions";
import { useAppData } from "../data/AppDataProvider";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export default function Announcements() {
  const user = getCurrentUser();
  const { announcements, divisions, loading, error, reload } = useAppData();
  const [open, setOpen] = useState(false);

  return (
    <Page title="Pengumuman Internal" subtitle="Daftar pengumuman perusahaan, target divisi, dan prioritas." action={(user.role === "Owner" || user.role === "Wakil Owner") && <button onClick={() => setOpen(true)} className="rounded bg-navy-800 px-4 py-2 text-sm font-semibold text-white">Buat Pengumuman</button>}>
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      <DataTable
        rows={announcements}
        columns={[
          { key: "title", header: "Judul" },
          { key: "content", header: "Isi", render: (row) => <span className="block max-w-lg whitespace-normal">{row.content}</span> },
          { key: "author", header: "Dibuat Oleh" },
          { key: "date", header: "Tanggal" },
          { key: "target", header: "Target Divisi" },
          { key: "priority", header: "Prioritas", render: (row) => <Badge>{row.priority}</Badge> },
        ]}
      />
      <Modal open={open} title="Form Pengumuman" onClose={() => setOpen(false)}>
        <AnnouncementForm divisions={divisions} user={user} onSaved={() => { setOpen(false); reload(); }} />
      </Modal>
    </Page>
  );
}

function AnnouncementForm({ divisions, user, onSaved }) {
  const [form, setForm] = useState({ title: "", content: "", target: "Semua Divisi", priority: "Sedang" });
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

    if (!form.title.trim() || !form.content.trim()) {
      setMessage("Judul dan isi pengumuman wajib diisi.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMessage("Session login belum aktif. Silakan logout lalu login ulang.");
      return;
    }

    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("announcements").insert({
      title: form.title,
      content: form.content,
      author: user?.name || "Owner",
      date: today,
      target: form.target,
      priority: form.priority,
    });

    if (error) {
      const isPolicyError = error.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? "Akses ditolak oleh policy role. Pastikan migrasi supabase-role-policies.sql sudah dijalankan." : error.message);
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || "Owner",
      division_id: "all",
      action: `membuat pengumuman "${form.title}"`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: "owner",
    });

    setSaving(false);
    onSaved();
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      {message && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{message}</div>}
      <label className="form-field">
        <span className="form-label">Judul Pengumuman</span>
        <input className="form-control" placeholder="Judul pengumuman" value={form.title} onChange={(event) => updateField("title", event.target.value)} />
      </label>
      <label className="form-field">
        <span className="form-label">Isi Pengumuman</span>
        <textarea className="form-control" placeholder="Isi pengumuman" value={form.content} onChange={(event) => updateField("content", event.target.value)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="form-field">
          <span className="form-label">Target</span>
          <select className="form-control" value={form.target} onChange={(event) => updateField("target", event.target.value)}>
            <option>Semua Divisi</option>
            {divisions.map((division) => <option key={division.id}>{division.name}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span className="form-label">Prioritas</span>
          <select className="form-control" value={form.priority} onChange={(event) => updateField("priority", event.target.value)}>
            <option>Tinggi</option>
            <option>Sedang</option>
            <option>Rendah</option>
          </select>
        </label>
      </div>
      <div className="form-actions">
        <button disabled={saving} className="primary-action w-full sm:w-auto">
          {saving ? "Mempublikasikan..." : "Publikasikan"}
        </button>
      </div>
    </form>
  );
}
