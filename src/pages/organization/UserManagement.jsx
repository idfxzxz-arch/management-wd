import { useState } from "react";
import { Pencil, Power, Trash2, UserPlus } from "lucide-react";
import Badge from "../../components/Badge";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { Page } from "../../components/PageShell";
import { useAppData } from "../../data/AppDataProvider";
import { getCurrentUser } from "../../utils/auth";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

export default function UserManagement() {
  const user = getCurrentUser();
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deletingNow, setDeletingNow] = useState(false);
  const { users, divisions, divisionName, loading, error, reload } = useAppData();
  const [message, setMessage] = useState("");
  const canManage = user?.role === "Owner" || user?.role === "Wakil Owner" || user?.role === "Developer";

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
      setMessage(isPolicyError ? "Hanya Owner, Wakil Owner, atau Developer aktif yang dapat mengubah user." : updateError.message);
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

  async function deleteUser() {
    if (!deleting || !canManage) return;
    setMessage("");

    if (deleting.email?.toLowerCase() === user?.email?.toLowerCase()) {
      setMessage("Anda tidak dapat menghapus akun sendiri.");
      return;
    }

    setDeletingNow(true);
    const { data, error: deleteError } = await supabase.functions.invoke("manage-user", {
      body: { action: "delete", id: deleting.id, email: deleting.email },
    });

    if (deleteError || data?.error) {
      setMessage(data?.error || deleteError?.message || "Gagal menghapus user.");
      setDeletingNow(false);
      return;
    }

    setDeletingNow(false);
    setDeleting(null);
    setMessage(`User ${deleting.email} berhasil dihapus dan tidak bisa login lagi.`);
    reload();
  }

  return (
    <Page
      title="User Management"
      subtitle="Daftar user, role, divisi, dan status akun."
      action={canManage && (
        <button onClick={() => setCreating(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-900">
          <UserPlus size={16} />
          Tambah User
        </button>
      )}
    >
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
      <DataTable
        rows={users}
        columns={[
          { key: "name", header: "Nama", width: "20%", contentClassName: "font-medium text-slate-900" },
          { key: "email", header: "Email", width: "25%" },
          { key: "role", header: "Role", width: "110px", render: (row) => <Badge>{row.role}</Badge> },
          { key: "divisionId", header: "Divisi", width: "20%", render: (row) => divisionName(row.divisionId, row.role) },
          { key: "status", header: "Status", width: "105px", render: (row) => <Badge>{row.status}</Badge> },
          ...(canManage ? [{ key: "actions", header: "Aksi", render: (row) => (
            <div className="flex items-center gap-1.5">
              <ActionButton label="Edit user" onClick={() => setSelected(row)} tone="neutral">
                <Pencil size={15} />
              </ActionButton>
              <ActionButton
                label={row.status === "Aktif" ? "Nonaktifkan user" : "Aktifkan user"}
                onClick={() => updateStatus(row, row.status === "Aktif" ? "Nonaktif" : "Aktif")}
                tone={row.status === "Aktif" ? "warning" : "success"}
              >
                <Power size={15} />
              </ActionButton>
              <ActionButton
                label="Hapus user"
                disabled={row.email?.toLowerCase() === user?.email?.toLowerCase()}
                onClick={() => setDeleting(row)}
                tone="danger"
              >
                <Trash2 size={15} />
              </ActionButton>
            </div>
          ), width: "132px", cellClassName: "align-middle", contentClassName: "min-w-[118px]" }] : []),
        ]}
      />
      <Modal open={canManage && Boolean(selected)} title="Edit User" onClose={() => setSelected(null)}>
        {selected && <UserForm selected={selected} divisions={divisions} actor={user} onSaved={() => { setSelected(null); reload(); setMessage("User berhasil diperbarui."); }} />}
      </Modal>
      <Modal open={canManage && creating} title="Tambah User Baru" onClose={() => setCreating(false)}>
        <CreateUserForm divisions={divisions} onSaved={(result) => { setCreating(false); reload(); setMessage(`User ${result.email} berhasil dibuat. Password sementara: ${result.password}`); }} />
      </Modal>
      <Modal open={canManage && Boolean(deleting)} title="Hapus User Login" onClose={() => !deletingNow && setDeleting(null)}>
        {deleting && (
          <div>
            <p className="text-sm leading-6 text-slate-600">
              User <span className="font-semibold text-slate-900">{deleting.name}</span> dengan email <span className="font-semibold text-slate-900">{deleting.email}</span> akan dihapus dari User Management dan Supabase Auth, sehingga tidak bisa login lagi.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button disabled={deletingNow} onClick={() => setDeleting(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">Batal</button>
              <button disabled={deletingNow} onClick={deleteUser} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{deletingNow ? "Menghapus..." : "Ya, Hapus"}</button>
            </div>
          </div>
        )}
      </Modal>
    </Page>
  );
}

function ActionButton({ children, label, onClick, disabled = false, tone = "neutral" }) {
  const tones = {
    neutral: "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-navy-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function CreateUserForm({ divisions, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Staff",
    divisionId: divisions[0]?.id || "all",
    position: "",
    password: "123456",
    status: "Aktif",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const divisionLocked = ["Owner", "Wakil Owner", "Developer", "HRD"].includes(form.role);

  function updateField(key, value) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "role" && ["Owner", "Wakil Owner", "Developer", "HRD"].includes(value)) next.divisionId = "all";
      if (key === "role" && !next.position) next.position = value;
      return next;
    });
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");

    if (!isSupabaseConfigured) {
      setMessage("Koneksi data belum dikonfigurasi.");
      return;
    }
    if (!form.name.trim() || !form.email.trim() || !form.role) {
      setMessage("Nama, email, dan role wajib diisi.");
      return;
    }
    if (form.password.length < 6) {
      setMessage("Password sementara minimal 6 karakter.");
      return;
    }

    setSaving(true);
    const { data, error } = await supabase.functions.invoke("manage-user", {
      body: {
        name: form.name,
        email: form.email,
        role: form.role,
        divisionId: divisionLocked ? "all" : form.divisionId,
        position: form.position || form.role,
        password: form.password,
        status: form.status,
      },
    });

    if (error || data?.error) {
      setMessage(data?.error || error?.message || "Gagal membuat user.");
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved(data);
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      {message && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{message}</div>}
      <label className="form-field">
        <span className="form-label">Nama</span>
        <input className="form-control" placeholder="Nama user" value={form.name} onChange={(event) => updateField("name", event.target.value)} />
      </label>
      <label className="form-field">
        <span className="form-label">Email Login</span>
        <input className="form-control" type="email" placeholder="email@domain.com" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="form-field">
          <span className="form-label">Role</span>
          <select className="form-control" value={form.role} onChange={(event) => updateField("role", event.target.value)}>
            <option>Owner</option>
            <option>Kepala Divisi</option>
            <option>Staff</option>
            <option>Magang</option>
            <option>Wakil Owner</option>
            <option>Developer</option>
            <option>HRD</option>
          </select>
        </label>
        <label className="form-field">
          <span className="form-label">Divisi</span>
          <select disabled={divisionLocked} className="form-control" value={divisionLocked ? "all" : form.divisionId} onChange={(event) => updateField("divisionId", event.target.value)}>
            <option value="all">Semua Divisi</option>
            {divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
          </select>
        </label>
      </div>
      <label className="form-field">
        <span className="form-label">Jabatan</span>
        <input className="form-control" placeholder="Jabatan" value={form.position} onChange={(event) => updateField("position", event.target.value)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="form-field">
          <span className="form-label">Password Sementara</span>
          <input className="form-control" type="text" value={form.password} onChange={(event) => updateField("password", event.target.value)} />
        </label>
        <label className="form-field">
          <span className="form-label">Status</span>
          <select className="form-control" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
            <option>Aktif</option>
            <option>Nonaktif</option>
          </select>
        </label>
      </div>
      <div className="form-actions">
        <button disabled={saving} className="primary-action w-full sm:w-auto">
          {saving ? "Membuat..." : "Buat User"}
        </button>
      </div>
    </form>
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
        role: form.role,
        division_id: form.divisionId,
        status: form.status,
      })
      .eq("id", selected.id);

    if (error) {
      const isPolicyError = error.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? "Hanya Owner, Wakil Owner, atau Developer aktif yang dapat mengubah user." : error.message);
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
    <form className="form-grid" onSubmit={submit}>
      {message && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{message}</div>}
      <label className="form-field">
        <span className="form-label">Nama</span>
        <input className="form-control" value={form.name} onChange={(event) => updateField("name", event.target.value)} />
      </label>
      <label className="form-field">
        <span className="form-label">Email Login</span>
        <input disabled className="form-control" type="email" value={form.email} />
        <p className="mt-1 text-xs text-slate-500">Email login dikelola melalui Supabase Authentication agar akun tidak terputus.</p>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="form-field">
          <span className="form-label">Role</span>
          <select className="form-control" value={form.role} onChange={(event) => updateField("role", event.target.value)}>
            <option>Owner</option>
            <option>Kepala Divisi</option>
            <option>Staff</option>
            <option>Magang</option>
            <option>Wakil Owner</option>
            <option>Developer</option>
            <option>HRD</option>
          </select>
        </label>
        <label className="form-field">
          <span className="form-label">Divisi</span>
          <select className="form-control" value={form.divisionId} onChange={(event) => updateField("divisionId", event.target.value)}>
            <option value="all">Semua Divisi</option>
            {divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
          </select>
        </label>
      </div>
      <label className="form-field">
        <span className="form-label">Status</span>
        <select className="form-control" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
          <option>Aktif</option>
          <option>Nonaktif</option>
        </select>
      </label>
      <div className="form-actions">
        <button disabled={saving} className="primary-action w-full sm:w-auto">
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}
