import Badge from "../../components/Badge";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { useState } from "react";
import { Activity, AlertTriangle, BarChart3, CheckCircle2, ClipboardList, Send, Target } from "lucide-react";
import { getCurrentUser } from "../../utils/auth";
import { detectPerformance, isStaffLike } from "../../utils/helpers";
import { Page } from "../../components/PageShell";
import StatCard from "../../components/StatCard";
import ProgressBar from "../../components/ProgressBar";
import { useAppData } from "../../data/AppDataProvider";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

export default function WorkReports() {
  const user = getCurrentUser();
  const { reports, weeklyReports, divisionName, loading, error, reload } = useAppData();
  const [open, setOpen] = useState(false);
  const canSubmitReport = isStaffLike(user?.role) || user?.role === "Kepala Divisi";
  const rows = reports;
  const weeklyRows = weeklyReports;
  const totals = weeklyRows.reduce(
    (acc, report) => {
      acc.completed += report.completedTasks;
      acc.target += report.targetTasks;
      acc.late += report.lateTasks;
      acc.revision += report.revisionTasks;
      acc.progress += report.averageProgress;
      return acc;
    },
    { completed: 0, target: 0, late: 0, revision: 0, progress: 0 }
  );
  const averageProgress = weeklyRows.length ? Math.round(totals.progress / weeklyRows.length) : 0;
  const completionRate = totals.target ? Math.round((totals.completed / totals.target) * 100) : 0;
  const detected = detectPerformance({
    averageProgress,
    completedTasks: totals.completed,
    targetTasks: totals.target,
    lateTasks: totals.late,
    revisionTasks: totals.revision,
  });

  return (
    <Page
      title="Laporan Kerja"
      subtitle="Laporan harian, laporan mingguan, statistik, dan deteksi kinerja otomatis."
      action={canSubmitReport && (
        <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-900">
          <Send size={16} />
          Kirim Laporan
        </button>
      )}
    >
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Laporan Mingguan" value={weeklyRows.length} icon={ClipboardList} tone="blue" />
        <StatCard title="Target Selesai" value={`${totals.completed}/${totals.target}`} icon={Target} tone="purple" />
        <StatCard title="Rata-rata Progress" value={`${averageProgress}%`} icon={BarChart3} tone="green" />
        <StatCard title="Terlambat" value={totals.late} icon={AlertTriangle} tone="red" />
        <StatCard title="Skor Kinerja" value={detected.score} icon={Activity} tone={detected.tone} />
      </div>

      <section className="surface-panel p-5">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="section-title font-semibold text-slate-900">Deteksi Kinerja Mingguan</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{detected.recommendation}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge>{detected.label}</Badge>
              <Badge>{completionRate >= 80 ? "Selesai" : completionRate >= 55 ? "Proses" : "Perlu Perhatian"}</Badge>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white/80 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Completion Rate</p>
                <p className="text-sm font-bold text-slate-900">{completionRate}%</p>
              </div>
              <ProgressBar value={completionRate} />
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/80 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Average Progress</p>
                <p className="text-sm font-bold text-slate-900">{averageProgress}%</p>
              </div>
              <ProgressBar value={averageProgress} />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title font-semibold text-slate-900">Laporan Mingguan</h2>
          <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 sm:flex">
            <CheckCircle2 size={14} />
            Deteksi otomatis aktif
          </div>
        </div>
        <DataTable
          rows={weeklyRows.map((report) => ({ ...report, detected: detectPerformance(report) }))}
          columns={[
            { key: "week", header: "Minggu" },
            { key: "staff", header: "Nama" },
            { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
            { key: "target", header: "Target", render: (row) => `${row.completedTasks}/${row.targetTasks}` },
            { key: "averageProgress", header: "Progress", render: (row) => <div className="min-w-[150px]"><ProgressBar value={row.averageProgress} /></div> },
            { key: "detected", header: "Deteksi", render: (row) => <Badge>{row.detected.label}</Badge> },
            { key: "summary", header: "Ringkasan", render: (row) => <span className="cell-clamp">{row.summary}</span> },
            { key: "blocker", header: "Kendala", render: (row) => <span className="cell-clamp">{row.blocker}</span> },
            { key: "headNote", header: "Catatan", render: (row) => <span className="cell-clamp">{row.headNote}</span> },
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="section-title font-semibold text-slate-900">Laporan Harian</h2>
      <DataTable
        rows={rows}
        columns={[
          { key: "staff", header: "Nama Staff" },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "done", header: "Sudah Dilakukan", render: (row) => <span className="block max-w-md whitespace-normal">{row.done}</span> },
          { key: "blockers", header: "Kendala", render: (row) => <span className="block max-w-md whitespace-normal">{row.blockers}</span> },
          { key: "next", header: "Rencana Berikutnya", render: (row) => <span className="block max-w-md whitespace-normal">{row.next}</span> },
          { key: "date", header: "Tanggal" },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
        ]}
      />
      </section>
      <Modal open={canSubmitReport && open} title="Form Laporan Kerja" onClose={() => setOpen(false)}>
        <ReportForm user={user} onSaved={() => { setOpen(false); reload(); }} />
      </Modal>
    </Page>
  );
}

function ReportForm({ user, onSaved }) {
  const [type, setType] = useState("daily");
  const [form, setForm] = useState({
    targetTasks: "",
    completedTasks: "",
    averageProgress: "",
    lateTasks: "0",
    revisionTasks: "0",
    done: "",
    blockers: "",
    next: "",
    week: "",
    period: "",
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

    if (!form.done.trim()) {
      setMessage("Isi pekerjaan yang sudah dilakukan.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMessage("Session login belum aktif. Silakan logout lalu login ulang.");
      return;
    }

    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const staff = user?.name || "Staff";
    const divisionId = user?.divisionId || "all";
    const table = type === "daily" ? "reports" : "weekly_reports";
    const payload = type === "daily" ? {
      employee_id: user?.employeeId,
      staff,
      division_id: divisionId,
      done: form.done,
      blockers: form.blockers,
      next: form.next,
      date: today,
      status: "Dikirim",
    } : {
      employee_id: user?.employeeId,
      week: form.week || `Minggu ${today}`,
      period: form.period,
      staff,
      division_id: divisionId,
      completed_tasks: Number(form.completedTasks) || 0,
      target_tasks: Number(form.targetTasks) || 0,
      average_progress: Number(form.averageProgress) || 0,
      late_tasks: Number(form.lateTasks) || 0,
      revision_tasks: Number(form.revisionTasks) || 0,
      summary: form.done,
      blocker: form.blockers,
      next_plan: form.next,
      head_note: "",
      status: "Dikirim",
    };

    const { error } = await supabase.from(table).insert(payload);

    if (error) {
      const isPolicyError = error.message.toLowerCase().includes("row-level security");
      setMessage(isPolicyError ? "Hanya akun Staf, Magang, atau Kepala Divisi yang dapat mengirim laporan miliknya sendiri." : error.message);
      setSaving(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      actor: staff,
      division_id: divisionId,
      action: `mengirim ${type === "daily" ? "laporan harian" : "laporan mingguan"}`,
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
        <span className="form-label">Jenis Laporan</span>
        <select className="form-control" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="daily">Laporan Harian</option>
          <option value="weekly">Laporan Mingguan</option>
        </select>
      </label>
      {type === "weekly" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="form-field"><span className="form-label">Minggu Laporan</span><input className="form-control" placeholder="Minggu laporan" value={form.week} onChange={(event) => updateField("week", event.target.value)} /></label>
          <label className="form-field"><span className="form-label">Periode</span><input className="form-control" placeholder="Periode" value={form.period} onChange={(event) => updateField("period", event.target.value)} /></label>
          <label className="form-field"><span className="form-label">Target Tugas</span><input className="form-control" type="number" min="0" placeholder="Target tugas" value={form.targetTasks} onChange={(event) => updateField("targetTasks", event.target.value)} /></label>
          <label className="form-field"><span className="form-label">Tugas Selesai</span><input className="form-control" type="number" min="0" placeholder="Tugas selesai" value={form.completedTasks} onChange={(event) => updateField("completedTasks", event.target.value)} /></label>
          <label className="form-field"><span className="form-label">Rata-rata Progress</span><input className="form-control" type="number" min="0" max="100" placeholder="Rata-rata progress" value={form.averageProgress} onChange={(event) => updateField("averageProgress", event.target.value)} /></label>
          <label className="form-field"><span className="form-label">Tugas Terlambat</span><input className="form-control" type="number" min="0" placeholder="Tugas terlambat" value={form.lateTasks} onChange={(event) => updateField("lateTasks", event.target.value)} /></label>
          <label className="form-field"><span className="form-label">Tugas Revisi</span><input className="form-control" type="number" min="0" placeholder="Tugas revisi" value={form.revisionTasks} onChange={(event) => updateField("revisionTasks", event.target.value)} /></label>
        </div>
      )}
      <label className="form-field"><span className="form-label">Pekerjaan Selesai</span><textarea className="form-control" placeholder="Pekerjaan yang sudah dilakukan" value={form.done} onChange={(event) => updateField("done", event.target.value)} /></label>
      <label className="form-field"><span className="form-label">Kendala</span><textarea className="form-control" placeholder="Kendala" value={form.blockers} onChange={(event) => updateField("blockers", event.target.value)} /></label>
      <label className="form-field"><span className="form-label">Rencana Berikutnya</span><textarea className="form-control" placeholder="Rencana berikutnya" value={form.next} onChange={(event) => updateField("next", event.target.value)} /></label>
      <div className="form-actions">
        <button disabled={saving} className="primary-action w-full sm:w-auto">
          {saving ? "Mengirim..." : "Kirim"}
        </button>
      </div>
    </form>
  );
}
