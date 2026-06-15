import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
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
  const canManage = user?.role === "Owner" || user?.role === "Kepala Divisi" || user?.role === "Administrator";
  const rows = useMemo(() => scopedByDivision(minutes, user).filter((item) => contains(Object.values(item).join(" "), query)), [query, user]);

  return (
    <Page
      title="Notulen Rapat"
      subtitle="Judul, tanggal, pemimpin, peserta, pembahasan, keputusan, dan tindak lanjut."
      action={canManage && <button onClick={() => setOpen(true)} className="rounded bg-navy-800 px-4 py-2 text-sm font-semibold text-white">Tambah Notulen</button>}
    >
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
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
        ]}
      />
      <Modal open={open} title="Tambah Notulen Rapat" onClose={() => setOpen(false)}>
        <MinuteForm divisions={divisions} user={user} onSaved={() => { setOpen(false); reload(); }} />
      </Modal>
    </Page>
  );
}

function MinuteForm({ divisions, user, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    divisionId: user?.role === "Owner" || user?.role === "Administrator" ? "all" : user?.divisionId || "all",
    leader: user?.name || "",
    participants: "",
    discussion: "",
    decision: "",
    followUp: "",
    actionDeadline: "",
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
    const { error } = await supabase.from("minutes").insert({
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
    });

    if (error) {
      const isPolicyError = error.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? "Akses tambah notulen belum aktif. Jalankan SQL write policy lalu login ulang." : error.message);
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || "User",
      division_id: form.divisionId,
      action: `menambahkan notulen rapat "${form.title}"`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: user?.role === "Owner" || user?.role === "Administrator" ? "owner" : "info",
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
      <select className="rounded border border-slate-200 px-3 py-2" value={form.divisionId} onChange={(event) => updateField("divisionId", event.target.value)}>
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
        {saving ? "Menyimpan..." : "Simpan Notulen"}
      </button>
    </form>
  );
}
