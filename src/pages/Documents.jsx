import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
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
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [deletingNow, setDeletingNow] = useState(false);
  const canDelete = user?.role === "Owner" || user?.role === "Wakil Owner" || user?.role === "Developer";
  const canUpload = user?.role === "Owner" || user?.role === "Wakil Owner" || user?.role === "Developer" || user?.role === "Kepala Divisi";
  const rows = useMemo(() => scopedByDivision(documents, user).filter((doc) => contains(Object.values(doc).join(" "), query)), [query, user]);

  async function openDocument(document) {
    setMessage("");
    if (document.filePath) {
      const { data, error: signedUrlError } = await supabase.storage.from("company-documents").createSignedUrl(document.filePath, 60);
      if (signedUrlError) {
        setMessage(`Dokumen tidak dapat dibuka: ${signedUrlError.message}`);
        return;
      }
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (document.fileUrl) window.open(document.fileUrl, "_blank", "noopener,noreferrer");
  }

  async function deleteDocument() {
    if (!deleting || !canDelete) return;
    setMessage("");
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMessage("Session login belum aktif. Silakan login ulang.");
      return;
    }

    setDeletingNow(true);
    const { error: deleteError } = await supabase.from("documents").delete().eq("id", deleting.id);
    if (deleteError) {
      setMessage(deleteError.message.toLowerCase().includes("row-level security") ? "Role Anda tidak memiliki akses menghapus dokumen." : deleteError.message);
      setDeletingNow(false);
      return;
    }

    let storageError = null;
    if (deleting.filePath) {
      const result = await supabase.storage.from("company-documents").remove([deleting.filePath]);
      storageError = result.error;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || "User",
      division_id: deleting.divisionId,
      action: `menghapus dokumen "${deleting.name}"`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: "warning",
    });

    setDeletingNow(false);
    setDeleting(null);
    setSelected(null);
    setMessage(storageError ? `Data dokumen dihapus, tetapi file Storage gagal dibersihkan: ${storageError.message}` : "Dokumen dan file berhasil dihapus.");
    reload();
  }

  return (
    <Page title="Arsip Dokumen" subtitle="Daftar dokumen, kategori, divisi, tanggal upload, dan tipe file." action={canUpload && <button onClick={() => setOpen(true)} className="rounded bg-navy-800 px-4 py-2 text-sm font-semibold text-white">Upload Dokumen</button>}>
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      {message && <div className={`rounded-lg border p-4 text-sm ${message.includes("berhasil") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : message.includes("tetapi") ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>}
      <Search value={query} setValue={setQuery} placeholder="Cari dokumen, kategori, atau tipe file" />
      <DataTable
        rows={rows}
        columns={[
          { key: "name", header: "Nama Dokumen" },
          { key: "category", header: "Kategori" },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "uploadedAt", header: "Tanggal Upload" },
          { key: "type", header: "Tipe File" },
          { key: "fileUrl", header: "File", render: (row) => row.filePath || row.fileUrl ? <button onClick={() => openDocument(row)} className="font-semibold text-navy-700 hover:underline">Buka</button> : "-" },
          { key: "detail", header: "Aksi", render: (row) => <div className="flex items-center gap-2"><button onClick={() => setSelected(row)} className="rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Lihat Detail</button>{canDelete && <button type="button" title="Hapus dokumen" aria-label={`Hapus dokumen ${row.name}`} onClick={() => setDeleting(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100"><Trash2 size={15} /></button>}</div> },
        ]}
      />
      <Modal open={canUpload && open} title="Upload Dokumen" onClose={() => setOpen(false)}>
        <DocumentForm divisions={divisions} user={user} onSaved={() => { setOpen(false); reload(); }} />
      </Modal>
      <Modal open={Boolean(selected)} title="Detail Dokumen" onClose={() => setSelected(null)}>
        {selected && <div className="space-y-2 text-sm text-slate-700"><p><b>Nama:</b> {selected.name}</p><p><b>Kategori:</b> {selected.category}</p><p><b>Divisi:</b> {divisionName(selected.divisionId)}</p><p><b>Tipe:</b> {selected.type}</p>{(selected.filePath || selected.fileUrl) && <p><b>File:</b> <button className="font-semibold text-navy-700 hover:underline" onClick={() => openDocument(selected)}>{selected.fileName || "Buka dokumen"}</button></p>}</div>}
      </Modal>
      <Modal open={Boolean(deleting)} title="Hapus Dokumen" onClose={() => !deletingNow && setDeleting(null)}>
        {deleting && (
          <div>
            <p className="text-sm leading-6 text-slate-600">Dokumen <span className="font-semibold text-slate-900">{deleting.name}</span> dan file aslinya akan dihapus permanen dari Storage.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button disabled={deletingNow} onClick={() => setDeleting(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">Batal</button>
              <button disabled={deletingNow} onClick={deleteDocument} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{deletingNow ? "Menghapus..." : "Ya, Hapus"}</button>
            </div>
          </div>
        )}
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
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      setMessage("Tipe file tidak diizinkan. Gunakan PDF, Word, Excel, JPG, atau PNG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage("Ukuran file maksimal 10 MB.");
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

    const { error } = await supabase.from("documents").insert({
      name: form.name,
      category: form.category,
      division_id: form.divisionId,
      uploaded_at: new Date().toISOString().slice(0, 10),
      type: extension,
      file_url: "",
      file_name: file.name,
      file_path: path,
    });

    if (error) {
      const isPolicyError = error.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? "Anda hanya dapat mengunggah dokumen untuk divisi sendiri." : error.message);
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
    <form className="form-grid" onSubmit={submit}>
      {message && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{message}</div>}
      <label className="form-field">
        <span className="form-label">Nama Dokumen</span>
        <input className="form-control" placeholder="Nama dokumen" value={form.name} onChange={(event) => updateField("name", event.target.value)} />
      </label>
      <label className="form-field">
        <span className="form-label">Kategori</span>
        <input className="form-control" placeholder="Kategori" value={form.category} onChange={(event) => updateField("category", event.target.value)} />
      </label>
      <label className="form-field">
        <span className="form-label">Divisi</span>
        <select disabled={user?.role !== "Owner" && user?.role !== "Wakil Owner" && user?.role !== "Developer"} className="form-control" value={form.divisionId} onChange={(event) => updateField("divisionId", event.target.value)}>
          <option value="all">Semua Divisi</option>
          {divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
        </select>
      </label>
      <label className="form-field">
        <span className="form-label">File</span>
        <input className="form-control text-sm" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(event) => setFile(event.target.files?.[0] || null)} />
      </label>
      <div className="form-actions">
        <button disabled={saving} className="primary-action w-full sm:w-auto">
          {saving ? "Mengupload..." : "Upload Dokumen"}
        </button>
      </div>
    </form>
  );
}
