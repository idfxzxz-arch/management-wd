import { useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { Page } from "./Divisions";
import { useAppData } from "../data/AppDataProvider";
import { getCurrentUser } from "../utils/auth";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export default function UserManagement() {
  const user = getCurrentUser();
  const [selected, setSelected] = useState(null);
  const { users, divisions, divisionName, loading, error, reload } = useAppData();
  const [message, setMessage] = useState("");

  async function updateStatus(row, status) {
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

    const { error: updateError } = await supabase.from("app_users").update({ status }).eq("id", row.id);
    if (updateError) {
      const isPolicyError = updateError.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? "Akses update user belum aktif. Jalankan SQL write policy lalu login ulang." : updateError.message);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || "Owner",
      division_id: row.divisionId || "all",
      action: `${status === "Aktif" ? "mengaktifkan" : "menonaktifkan"} user "${row.name}"`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: status === "Aktif" ? "success" : "warning",
    });

    setMessage(`User berhasil di${status === "Aktif" ? "aktifkan" : "nonaktifkan"}.`);
    reload();
  }

  return (
    <Page title="User Management" subtitle="Khusus Owner untuk melihat user, role, divisi, status, dan aksi .">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
      <DataTable
        rows={users}
        columns={[
          { key: "name", header: "Nama" },
          { key: "email", header: "Email" },
          { key: "role", header: "Role", render: (row) => <Badge>{row.role}</Badge> },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
          { key: "actions", header: "Aksi", render: (row) => <div className="flex gap-2"><button onClick={() => setSelected(row)} className="rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold">Edit</button><button onClick={() => updateStatus(row, row.status === "Aktif" ? "Nonaktif" : "Aktif")} className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">{row.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}</button></div> },
        ]}
      />
      <Modal open={Boolean(selected)} title="Edit User" onClose={() => setSelected(null)}>
        {selected && <UserForm selected={selected} divisions={divisions} actor={user} onSaved={() => { setSelected(null); reload(); setMessage("User berhasil diperbarui."); }} />}
      </Modal>
    </Page>
  );
}

function UserForm({ selected, divisions, actor, onSaved }) {
  const [form, setForm] = useState({
    name: selected.name,
    email: selected.email,
    role: selected.role,
    divisionId: selected.divisionId,
    status: selected.status,
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

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMessage("Session login belum aktif. Silakan logout lalu login ulang.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("app_users")
      .update({
        name: form.name,
        email: form.email,
        role: form.role,
        division_id: form.divisionId,
        status: form.status,
      })
      .eq("id", selected.id);

    if (error) {
      const isPolicyError = error.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? "Akses update user belum aktif. Jalankan SQL write policy lalu login ulang." : error.message);
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: actor?.name || "Owner",
      division_id: form.divisionId || "all",
      action: `mengubah data user "${form.name}"`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: "owner",
    });

    setSaving(false);
    onSaved();
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      {message && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{message}</div>}
      <input className="rounded border border-slate-200 px-3 py-2" value={form.name} onChange={(event) => updateField("name", event.target.value)} />
      <input className="rounded border border-slate-200 px-3 py-2" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <select className="rounded border border-slate-200 px-3 py-2" value={form.role} onChange={(event) => updateField("role", event.target.value)}>
          <option>Owner</option>
          <option>Kepala Divisi</option>
          <option>Staff</option>
        </select>
        <select className="rounded border border-slate-200 px-3 py-2" value={form.divisionId} onChange={(event) => updateField("divisionId", event.target.value)}>
          <option value="all">Semua Divisi</option>
          {divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
        </select>
      </div>
      <select className="rounded border border-slate-200 px-3 py-2" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
        <option>Aktif</option>
        <option>Nonaktif</option>
      </select>
      <button disabled={saving} className="rounded bg-navy-800 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
        {saving ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
