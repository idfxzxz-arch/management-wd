import { Activity, Building2, CheckCircle2, Clock, FileText, Users, XCircle } from "lucide-react";
import StatCard from "../components/StatCard";
import ProgressBar from "../components/ProgressBar";
import Badge from "../components/Badge";
import { detectPerformance } from "../utils/helpers";
import { useAppData } from "../data/AppDataProvider";
import { buildSubmissionRows, submissionStats } from "../utils/submissions";

export default function OwnerDashboard() {
  const { divisions, employees, tasks, taskSubmissions, minutes, activityLogs, weeklyReports, employeeName, loading, error } = useAppData();
  const done = tasks.filter((task) => task.status === "Selesai").length;
  const late = tasks.filter((task) => task.status === "Terlambat").length;
  const active = tasks.length - done;
  const progress = tasks.length ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length) : 0;
  const weeklyTotals = weeklyReports.reduce(
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
  const weeklyAverage = weeklyReports.length ? Math.round(weeklyTotals.progress / weeklyReports.length) : 0;
  const employeeRole = (id) => employees.find((employee) => String(employee.id) === String(id))?.role || "Staff";
  const reviewStats = submissionStats(buildSubmissionRows(tasks, taskSubmissions, { employeeName, employeeRole }));
  const weeklyPerformance = detectPerformance({
    averageProgress: weeklyAverage,
    completedTasks: weeklyTotals.completed,
    targetTasks: weeklyTotals.target,
    lateTasks: weeklyTotals.late,
    revisionTasks: weeklyTotals.revision,
  });

  return (
    <div className="space-y-6">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      <div className="surface-panel overflow-hidden">
        <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#0b1f3a_0%,#12305a_58%,#173b6d_100%)] px-5 py-5 text-white sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-100">Executive Overview</p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Dashboard Owner</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Ringkasan performa seluruh WD Group Company dalam satu tampilan cepat untuk presentasi dan monitoring internal.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white/10 px-4 py-3 ring-1 ring-white/15">
                <p className="text-xl font-bold">{progress}%</p>
                <p className="text-xs text-blue-100">Progress</p>
              </div>
              <div className="rounded-lg bg-white/10 px-4 py-3 ring-1 ring-white/15">
                <p className="text-xl font-bold">{active}</p>
                <p className="text-xs text-blue-100">Aktif</p>
              </div>
              <div className="rounded-lg bg-white/10 px-4 py-3 ring-1 ring-white/15">
                <p className="text-xl font-bold">{late}</p>
                <p className="text-xs text-blue-100">Risk</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Divisi" value={divisions.length} icon={Building2} tone="blue" />
        <StatCard title="Total Karyawan" value={employees.length} icon={Users} tone="purple" />
        <StatCard title="Tugas Aktif" value={active} icon={Clock} tone="yellow" />
        <StatCard title="Tugas Selesai" value={done} icon={CheckCircle2} tone="green" />
        <StatCard title="Tugas Terlambat" value={late} icon={XCircle} tone="red" />
        <StatCard title="Total Notulen" value={minutes.length} icon={FileText} tone="slate" />
        <StatCard title="Progress Perusahaan" value={`${progress}%`} icon={Activity} tone="green" />
        <StatCard title="Kinerja Mingguan" value={weeklyPerformance.label} icon={Activity} tone={weeklyPerformance.tone} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Menunggu Review" value={reviewStats.waitingReview} icon={Clock} tone="yellow" />
        <StatCard title="Approved" value={reviewStats.approved} icon={CheckCircle2} tone="green" />
        <StatCard title="Revisi" value={reviewStats.revision} icon={FileText} tone="red" />
        <StatCard title="Terlambat" value={reviewStats.late} icon={XCircle} tone="red" />
        <StatCard title="Revisi Dikirim Ulang" value={reviewStats.resentRevision} icon={Activity} tone="blue" />
        <StatCard title="Selesai Bulan Ini" value={reviewStats.doneThisMonth} icon={CheckCircle2} tone="green" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="surface-panel p-5">
          <h2 className="section-title font-semibold text-slate-900">Grafik Performa Divisi</h2>
          <div className="mt-5 space-y-4">
            {divisions.map((division, index) => (
              <div key={division.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{division.name}</span>
                  <span className="text-slate-500">{[88, 81, 64, 78, 90][index]}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-200">
                  <div className="h-3 rounded-full bg-navy-700" style={{ width: `${[88, 81, 64, 78, 90][index]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="surface-panel p-5">
          <h2 className="section-title font-semibold text-slate-900">Aktivitas Terbaru</h2>
          <div className="mt-4 space-y-3">
            {activityLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="rounded-lg border border-slate-100 bg-white/80 p-3 shadow-sm">
                <p className="text-sm text-slate-700"><span className="font-semibold">{log.actor}</span> {log.action}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{log.time}</span>
                  <Badge>{log.severity === "danger" ? "Terlambat" : log.severity === "owner" ? "Owner" : log.severity === "warning" ? "Pending" : "Selesai"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="surface-panel p-5">
        <h2 className="section-title mb-4 font-semibold text-slate-900">Statistik Progress Perusahaan</h2>
        <ProgressBar value={progress} />
      </section>
      <section className="surface-panel p-5">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <h2 className="section-title font-semibold text-slate-900">Deteksi Kinerja Perusahaan</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{weeklyPerformance.recommendation}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{weeklyPerformance.label}</Badge>
              <Badge>{weeklyTotals.late > 0 ? "Perlu Perhatian" : "Selesai"}</Badge>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">Selesai / Target</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{weeklyTotals.completed}/{weeklyTotals.target}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">Rata-rata Progress</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{weeklyAverage}%</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">Skor Deteksi</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{weeklyPerformance.score}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
