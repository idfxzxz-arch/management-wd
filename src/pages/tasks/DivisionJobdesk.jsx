import { useMemo, useState } from "react";
import Badge from "../../components/Badge";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { getCurrentUser } from "../../utils/auth";
import { contains, isStaffLike } from "../../utils/helpers";
import { Page, Search } from "../../components/PageShell";
import { useAppData } from "../../data/AppDataProvider";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { queueTaskEmailNotification } from "../../utils/taskEmailNotifications";

export default function DivisionJobdesk() {
  const user = getCurrentUser();
  const { tasks, divisions, employees, divisionName, scopedByDivision, loading, error, reload } = useAppData();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const canManage = !isStaffLike(user?.role);
  const rows = useMemo(() => scopedByDivision(tasks, user).filter((task) => contains(task.title + task.target + task.status + task.assignedByName, query)), [query, user]);

  return (
    <Page
      title="Jobdesk Per Divisi"
      subtitle="Daftar jobdesk berdasarkan divisi, pemberi tugas, target kerja, prioritas, deadline, dan status."
      action={canManage && <button onClick={() => setOpen(true)} className="rounded bg-navy-800 px-4 py-2 text-sm font-semibold text-white">Tambah</button>}
    >
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      {notice && <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">{notice}</div>}
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
      <Modal open={canManage && open} title="Form Tambah Jobdesk" size="lg" onClose={() => setOpen(false)}>
        <JobdeskForm divisions={divisions} employees={employees} user={user} divisionName={divisionName} onNotice={setNotice} onSaved={() => { setOpen(false); reload(); }} />
      </Modal>
    </Page>
  );
}

const fallbackDivisions = [
  { id: "it", name: "Information Technology" },
  { id: "project-content", name: "Project Manager & Konten" },
  { id: "admin-booking", name: "Administrasi & Booking" },
  { id: "media-production", name: "Media Production" },
  { id: "public-relation-admin", name: "Public Relation & Admin" },
];

function buildDivisionOptions(divisions, employees) {
  const map = new Map();
  for (const division of divisions || []) {
    if (division?.id && division.id !== "all") map.set(division.id, { id: division.id, name: division.name || division.id });
  }
  for (const employee of employees || []) {
    if (employee?.divisionId && employee.divisionId !== "all" && !map.has(employee.divisionId)) {
      map.set(employee.divisionId, { id: employee.divisionId, name: employee.divisionId });
    }
  }
  if (!map.size) {
    for (const division of fallbackDivisions) map.set(division.id, division);
  }
  return [...map.values()];
}

function JobdeskForm({ divisions, employees, user, divisionName, onNotice, onSaved }) {
  const baseDivisionOptions = buildDivisionOptions(divisions, employees);
  const divisionOptions = [{ id: "all", name: "Semua Divisi" }, ...baseDivisionOptions];
  const managedDivisionId = baseDivisionOptions[0]?.id || user?.divisionId || "it";
  const managementRoles = ["Owner", "Wakil Owner", "Developer", "HRD"];
  const broadcastRoles = ["Kepala Divisi", "Staff", "Magang"];
  const canReceiveTask = (employee, divisionId = managedDivisionId) => {
    const allowedRoles = ["Owner", "Wakil Owner", "Developer", "HRD", "Kepala Divisi", "Staff", "Magang"];
    const isManagementAssignee = managementRoles.includes(employee.role);
    if (divisionId === "all") {
      return employee.status === "Aktif" && broadcastRoles.includes(employee.role) && employee.divisionId && employee.divisionId !== "all";
    }
    return (
      allowedRoles.includes(employee.role) &&
      (isManagementAssignee || employee.divisionId === divisionId)
    );
  };
  const [form, setForm] = useState({
    title: "",
    description: "",
    divisionId: managedDivisionId,
    assigneeId: employees.find((employee) => canReceiveTask(employee))?.id || "",
    assignedBy: user?.role === "Owner" || user?.role === "Wakil Owner" || user?.role === "Developer" ? user.role : "Kepala Divisi",
    target: "",
    priority: "Sedang",
    deadline: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isBroadcast = form.divisionId === "all";
  const assignees = employees.filter((employee) => canReceiveTask(employee, form.divisionId));
  const managementAssignees = assignees.filter((employee) => managementRoles.includes(employee.role));
  const staffAssignees = assignees.filter((employee) => !managementRoles.includes(employee.role) && employee.role !== "Magang");
  const internAssignees = assignees.filter((employee) => employee.role === "Magang");
  const assigneeLabel = (employee) => `${employee.name} - ${employee.role === "Magang" ? "Anak Magang" : employee.role}`;

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

    if (!form.title || !form.description || !form.target || !form.deadline || (!isBroadcast && !form.assigneeId)) {
      setMessage(`Lengkapi judul, deskripsi, target, deadline${isBroadcast ? "" : ", dan penerima tugas"}.`);
      return;
    }
    const broadcastAssignees = assignees.filter((employee) => employee.email);
    const assignee = isBroadcast ? null : assignees.find((employee) => String(employee.id) === String(form.assigneeId));
    if (isBroadcast) {
      if (!broadcastAssignees.length) {
        setMessage("Tidak ada anggota aktif dengan email login di semua divisi.");
        return;
      }
    } else {
      if (!assignee || (!managementRoles.includes(assignee.role) && assignee.divisionId !== form.divisionId)) {
        setMessage("Penerima tugas harus berasal dari divisi yang dipilih, kecuali Owner, Wakil Owner, Developer, atau HRD.");
        return;
      }
    }

    setSaving(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMessage("Session login belum aktif. Silakan logout lalu login ulang.");
      setSaving(false);
      return;
    }

    const buildPayload = (targetAssignee, targetDivisionId) => ({
      division_id: targetDivisionId,
      assignee_id: Number(targetAssignee.id),
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
    });

    const payloads = isBroadcast
      ? broadcastAssignees.map((targetAssignee) => buildPayload(targetAssignee, targetAssignee.divisionId))
      : [buildPayload(assignee, form.divisionId)];

    const { data: createdTasks, error } = await supabase.from("tasks").insert(payloads).select("*");

    if (error) {
      const isPolicyError = error.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? "Policy database belum mengizinkan Kepala Divisi membuat tugas lintas divisi. Jalankan policy terbaru." : error.message);
      setSaving(false);
      return;
    }

    let sentCount = 0;
    let queuedCount = 0;
    let failedMessage = "";
    for (const createdTask of createdTasks || []) {
      const targetAssignee = isBroadcast
        ? broadcastAssignees.find((employee) => String(employee.id) === String(createdTask.assignee_id))
        : assignee;
      if (!targetAssignee) continue;
      const emailResult = await queueTaskEmailNotification({
        task: createdTask,
        assignee: targetAssignee,
        actorName: user?.name || form.assignedBy,
        divisionName: divisionName(createdTask.division_id),
      });
      if (emailResult.sent) sentCount += 1;
      else if (emailResult.queued) queuedCount += 1;
      if (!emailResult.sent && emailResult.error && !failedMessage) failedMessage = emailResult.error;
    }

    if (isBroadcast) {
      const total = createdTasks?.length || 0;
      const emailInfo = sentCount
        ? `${sentCount} email terkirim`
        : queuedCount
          ? `${queuedCount} email masuk antrean`
          : failedMessage
            ? `email belum terkirim: ${failedMessage}`
            : "tidak ada email terkirim";
      onNotice(`${total} jobdesk tersimpan untuk semua divisi dan anggota. ${emailInfo}.`);
    } else if (sentCount) {
      onNotice(`Tugas tersimpan dan email notifikasi terkirim ke ${assignee.email}.`);
    } else if (queuedCount) {
      onNotice(`Tugas tersimpan, tapi email belum terkirim ke ${assignee.email}: ${failedMessage || "function email belum aktif."}`);
    } else {
      onNotice(`Tugas tersimpan, tapi antrean email gagal dibuat: ${failedMessage || "cek konfigurasi email."}`);
    }

    await supabase.from("activity_logs").insert({
      actor: user?.name || form.assignedBy,
      division_id: form.divisionId,
      action: isBroadcast ? `membuat jobdesk "${form.title}" untuk semua divisi` : `membuat jobdesk "${form.title}"`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: user?.role === "Owner" || user?.role === "Wakil Owner" || user?.role === "Developer" ? "owner" : "info",
    });

    setSaving(false);
    onSaved();
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      {message && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{message}</div>}
      <label className="form-field">
        <span className="form-label">Judul Tugas</span>
        <input className="form-control" placeholder="Masukkan judul tugas" value={form.title} onChange={(event) => updateField("title", event.target.value)} />
      </label>
      <label className="form-field">
        <span className="form-label">Deskripsi</span>
        <textarea className="form-control" placeholder="Tuliskan deskripsi singkat tugas" value={form.description} onChange={(event) => updateField("description", event.target.value)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="form-field">
          <span className="form-label">Divisi</span>
          <select className="form-control" value={form.divisionId} onChange={(event) => setForm((current) => ({ ...current, divisionId: event.target.value, assigneeId: event.target.value === "all" ? "all" : "" }))}>
            {divisionOptions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
          </select>
          {!divisions.length && (
            <p className="mt-1 text-xs text-amber-600">
              Data divisi utama belum terbaca, memakai pilihan default. Jalankan policy terbaru jika penerima tugas masih kosong.
            </p>
          )}
        </label>
        <label className="form-field">
          <span className="form-label">Penerima Tugas</span>
          <select disabled={isBroadcast} className="form-control" value={isBroadcast ? "all" : form.assigneeId} onChange={(event) => updateField("assigneeId", event.target.value)}>
            {isBroadcast ? (
              <option value="all">Semua anggota aktif di semua divisi ({assignees.length})</option>
            ) : (
              <option value="">{assignees.length ? "Pilih penerima tugas" : "Tidak ada penerima di divisi ini"}</option>
            )}
            {!isBroadcast && managementAssignees.length > 0 && (
              <optgroup label="Manajemen">
                {managementAssignees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} - {employee.role}</option>)}
              </optgroup>
            )}
            {!isBroadcast && staffAssignees.length > 0 && (
              <optgroup label={`Staf ${divisionName(form.divisionId)}`}>
                {staffAssignees.map((employee) => <option key={employee.id} value={employee.id}>{assigneeLabel(employee)}</option>)}
              </optgroup>
            )}
            {!isBroadcast && internAssignees.length > 0 && (
              <optgroup label={`Anak Magang ${divisionName(form.divisionId)}`}>
                {internAssignees.map((employee) => <option key={employee.id} value={employee.id}>{assigneeLabel(employee)}</option>)}
              </optgroup>
            )}
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="form-field">
          <span className="form-label">Dibuat Oleh</span>
          <select disabled className="form-control" value={form.assignedBy} onChange={(event) => updateField("assignedBy", event.target.value)}>
            <option>Owner</option>
            <option>Wakil Owner</option>
            <option>Developer</option>
            <option>Kepala Divisi</option>
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
      <label className="form-field">
        <span className="form-label">Target Kerja</span>
        <input className="form-control" placeholder="Contoh: selesai 3 konten feed" value={form.target} onChange={(event) => updateField("target", event.target.value)} />
      </label>
      <label className="form-field">
        <span className="form-label">Deadline</span>
        <input className="form-control" type="date" value={form.deadline} onChange={(event) => updateField("deadline", event.target.value)} />
      </label>
      <label className="form-field">
        <span className="form-label">Catatan</span>
        <textarea className="form-control" placeholder="Catatan kepala divisi / owner" value={form.note} onChange={(event) => updateField("note", event.target.value)} />
      </label>
      <div className="form-actions">
        <button disabled={saving} className="primary-action w-full sm:w-auto">
          {saving ? "Menyimpan..." : "Simpan ke Database"}
        </button>
      </div>
    </form>
  );
}
