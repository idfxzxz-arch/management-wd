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
    <Page title="Pengumuman Internal" subtitle="Daftar pengumuman perusahaan, target divisi, dan prioritas." action={user.role === "Owner" && <button onClick={() => setOpen(true)} className="rounded bg-navy-800 px-4 py-2 text-sm font-semibold text-white">Buat Pengumuman</button>}>
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
      setMessage(isPolicyError ? "Akses simpan pengumuman belum aktif. Jalankan SQL write policy lalu login ulang." : error.message);
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
    <form className="grid gap-3" onSubmit={submit}>
      {message && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{message}</div>}
      <input className="rounded border border-slate-200 px-3 py-2" placeholder="Judul pengumuman" value={form.title} onChange={(event) => updateField("title", event.target.value)} />
      <textarea className="rounded border border-slate-200 px-3 py-2" placeholder="Isi pengumuman" value={form.content} onChange={(event) => updateField("content", event.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <select className="rounded border border-slate-200 px-3 py-2" value={form.target} onChange={(event) => updateField("target", event.target.value)}>
          <option>Semua Divisi</option>
          {divisions.map((division) => <option key={division.id}>{division.name}</option>)}
        </select>
        <select className="rounded border border-slate-200 px-3 py-2" value={form.priority} onChange={(event) => updateField("priority", event.target.value)}>
          <option>Tinggi</option>
          <option>Sedang</option>
          <option>Rendah</option>
        </select>
      </div>
      <button disabled={saving} className="rounded bg-navy-800 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
        {saving ? "Mempublikasikan..." : "Publikasikan"}
      </button>
    </form>
  );
}
