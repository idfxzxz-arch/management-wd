import { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { getCurrentUser } from "../utils/auth";
import { contains } from "../utils/helpers";
import { Page, Search } from "./Divisions";
import { useAppData } from "../data/AppDataProvider";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export default function Documents() {
  const user = getCurrentUser();
  const { documents, divisions, divisionName, scopedByDivision, loading, error, reload } = useAppData();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const rows = useMemo(() => scopedByDivision(documents, user).filter((doc) => contains(Object.values(doc).join(" "), query)), [query, user]);

  return (
    <Page title="Arsip Dokumen" subtitle="Daftar dokumen , kategori, divisi, tanggal upload, dan tipe file." action={<button onClick={() => setOpen(true)} className="rounded bg-navy-800 px-4 py-2 text-sm font-semibold text-white">Upload Dokumen</button>}>
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      <Search value={query} setValue={setQuery} placeholder="Cari dokumen, kategori, atau tipe file" />
      <DataTable
        rows={rows}
        columns={[
          { key: "name", header: "Nama Dokumen" },
          { key: "category", header: "Kategori" },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "uploadedAt", header: "Tanggal Upload" },
          { key: "type", header: "Tipe File" },
          { key: "fileUrl", header: "File", render: (row) => row.fileUrl ? <a className="font-semibold text-navy-700 hover:underline" href={row.fileUrl} target="_blank" rel="noreferrer">Buka</a> : "-" },
          { key: "detail", header: "Detail", render: (row) => <button onClick={() => setSelected(row)} className="rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Lihat Detail</button> },
        ]}
      />
      <Modal open={open} title="Upload Dokumen" onClose={() => setOpen(false)}>
        <DocumentForm divisions={divisions} user={user} onSaved={() => { setOpen(false); reload(); }} />
      </Modal>
      <Modal open={Boolean(selected)} title="Detail Dokumen" onClose={() => setSelected(null)}>
        {selected && <div className="space-y-2 text-sm text-slate-700"><p><b>Nama:</b> {selected.name}</p><p><b>Kategori:</b> {selected.category}</p><p><b>Divisi:</b> {divisionName(selected.divisionId)}</p><p><b>Tipe:</b> {selected.type}</p>{selected.fileUrl && <p><b>File:</b> <a className="font-semibold text-navy-700 hover:underline" href={selected.fileUrl} target="_blank" rel="noreferrer">{selected.fileName || "Buka dokumen"}</a></p>}</div>}
      </Modal>
    </Page>
  );
}

function DocumentForm({ divisions, user, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    divisionId: user?.divisionId === "all" ? "all" : user?.divisionId || "all",
  });
  const [file, setFile] = useState(null);
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

    if (!form.name.trim() || !form.category.trim() || !file) {
      setMessage("Nama, kategori, dan file dokumen wajib diisi.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMessage("Session login belum aktif. Silakan logout lalu login ulang.");
      return;
    }

    setSaving(true);
    const extension = file.name.includes(".") ? file.name.split(".").pop().toUpperCase() : "FILE";
    const path = `${form.divisionId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("company-documents").upload(path, file, { upsert: true });

    if (uploadError) {
      setMessage(uploadError.message.includes("Bucket not found") ? "Bucket storage company-documents belum dibuat. Jalankan SQL schema terbaru di Supabase." : uploadError.message);
      setSaving(false);
      return;
    }

    const { data } = supabase.storage.from("company-documents").getPublicUrl(path);
    const { error } = await supabase.from("documents").insert({
      name: form.name,
      category: form.category,
      division_id: form.divisionId,
      uploaded_at: new Date().toISOString().slice(0, 10),
      type: extension,
      file_url: data.publicUrl,
      file_name: file.name,
      file_path: path,
    });

    if (error) {
      const isPolicyError = error.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? "Akses simpan dokumen belum aktif. Jalankan SQL write policy lalu login ulang." : error.message);
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || "User",
      division_id: form.divisionId,
      action: `mengunggah dokumen "${form.name}"`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: "info",
    });

    setSaving(false);
    onSaved();
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      {message && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{message}</div>}
      <input className="rounded border border-slate-200 px-3 py-2" placeholder="Nama dokumen" value={form.name} onChange={(event) => updateField("name", event.target.value)} />
      <input className="rounded border border-slate-200 px-3 py-2" placeholder="Kategori" value={form.category} onChange={(event) => updateField("category", event.target.value)} />
      <select className="rounded border border-slate-200 px-3 py-2" value={form.divisionId} onChange={(event) => updateField("divisionId", event.target.value)}>
        <option value="all">Semua Divisi</option>
        {divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
      </select>
      <input className="rounded border border-slate-200 px-3 py-2 text-sm" type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
      <button disabled={saving} className="rounded bg-navy-800 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
        {saving ? "Mengupload..." : "Upload Dokumen"}
      </button>
    </form>
  );
}
