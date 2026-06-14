import { useMemo, useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { getCurrentUser } from "../utils/auth";
import { contains } from "../utils/helpers";
import { Page, Search } from "./Divisions";
import { useAppData } from "../data/AppDataProvider";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export default function DivisionJobdesk() {
  const user = getCurrentUser();
  const { tasks, divisions, employees, divisionName, scopedByDivision, loading, error, reload } = useAppData();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rows = useMemo(() => scopedByDivision(tasks, user).filter((task) => contains(task.title + task.target + task.status + task.assignedByName, query)), [query, user]);

  return (
    <Page
      title="Jobdesk Per Divisi"
      subtitle="Daftar jobdesk berdasarkan divisi, pemberi tugas, target kerja, prioritas, deadline, dan status."
      action={<button onClick={() => setOpen(true)} className="rounded bg-navy-800 px-4 py-2 text-sm font-semibold text-white">Tambah</button>}
    >
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      <Search value={query} setValue={setQuery} placeholder="Cari jobdesk divisi" />
      <DataTable
        rows={rows}
        columns={[
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "assignedBy", header: "Dari", render: (row) => <Badge>{row.assignedBy}</Badge> },
          { key: "assignedByName", header: "Pemberi Tugas" },
          { key: "title", header: "Tugas Utama" },
          { key: "target", header: "Target Kerja" },
          { key: "priority", header: "Prioritas", render: (row) => <Badge>{row.priority}</Badge> },
          { key: "deadline", header: "Deadline" },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
        ]}
      />
      <Modal open={open} title="Form Tambah Jobdesk" onClose={() => setOpen(false)}>
        <JobdeskForm divisions={divisions} employees={employees} user={user} onSaved={() => { setOpen(false); reload(); }} />
      </Modal>
    </Page>
  );
}

function JobdeskForm({ divisions, employees, user, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    divisionId: divisions[0]?.id || "it",
    assigneeId: employees.find((employee) => employee.role === "Staff" || employee.role === "Magang")?.id || "",
    assignedBy: user?.role === "Owner" ? "Owner" : "Kepala Divisi",
    target: "",
    priority: "Sedang",
    deadline: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const assignees = employees.filter((employee) => employee.role === "Staff" || employee.role === "Magang");

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

    if (!form.title || !form.description || !form.target || !form.deadline || !form.assigneeId) {
      setMessage("Lengkapi judul, deskripsi, target, deadline, dan penerima tugas.");
      return;
    }

    setSaving(true);
    const payload = {
      division_id: form.divisionId,
      assignee_id: Number(form.assigneeId),
      assigned_by: form.assignedBy,
      assigned_by_name: user?.name || form.assignedBy,
      title: form.title,
      description: form.description,
      target: form.target,
      priority: form.priority,
      deadline: form.deadline,
      status: "Belum Mulai",
      approval: "Draft",
      progress: 0,
      note: form.note,
      history: [`Tugas dibuat oleh ${user?.name || form.assignedBy}`],
    };

    const { error } = await supabase.from("tasks").insert(payload);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || form.assignedBy,
      division_id: form.divisionId,
      action: `membuat jobdesk "${form.title}"`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: user?.role === "Owner" ? "owner" : "info",
    });

    setSaving(false);
    onSaved();
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      {message && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{message}</div>}
      <input className="rounded-lg border border-slate-200 px-3 py-2" placeholder="Judul tugas" value={form.title} onChange={(event) => updateField("title", event.target.value)} />
      <textarea className="rounded-lg border border-slate-200 px-3 py-2" placeholder="Deskripsi singkat" value={form.description} onChange={(event) => updateField("description", event.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <select className="rounded-lg border border-slate-200 px-3 py-2" value={form.divisionId} onChange={(event) => updateField("divisionId", event.target.value)}>
          {divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
        </select>
        <select className="rounded-lg border border-slate-200 px-3 py-2" value={form.assigneeId} onChange={(event) => updateField("assigneeId", event.target.value)}>
          <option value="">Pilih penerima tugas</option>
          {assignees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select className="rounded-lg border border-slate-200 px-3 py-2" value={form.assignedBy} onChange={(event) => updateField("assignedBy", event.target.value)}>
          <option>Owner</option>
          <option>Kepala Divisi</option>
        </select>
        <select className="rounded-lg border border-slate-200 px-3 py-2" value={form.priority} onChange={(event) => updateField("priority", event.target.value)}>
          <option>Tinggi</option>
          <option>Sedang</option>
          <option>Rendah</option>
        </select>
      </div>
      <input className="rounded-lg border border-slate-200 px-3 py-2" placeholder="Target kerja" value={form.target} onChange={(event) => updateField("target", event.target.value)} />
      <input className="rounded-lg border border-slate-200 px-3 py-2" type="date" value={form.deadline} onChange={(event) => updateField("deadline", event.target.value)} />
      <textarea className="rounded-lg border border-slate-200 px-3 py-2" placeholder="Catatan kepala divisi / owner" value={form.note} onChange={(event) => updateField("note", event.target.value)} />
      <button disabled={saving} className="rounded-lg bg-navy-800 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
        {saving ? "Menyimpan..." : "Simpan ke Database"}
      </button>
    </form>
  );
}
