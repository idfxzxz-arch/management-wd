import { AlertTriangle, CheckCircle2, Clock, Users } from "lucide-react";
import Badge from "../components/Badge";
import StatCard from "../components/StatCard";
import { useAppData } from "../data/AppDataProvider";
import { buildSubmissionRows, submissionStats } from "../utils/submissions";
import { getCurrentUser } from "../utils/auth";

const taskStatusColors = {
  selesai: "#10b981",
  proses: "#2563eb",
  terlambat: "#f43f5e",
};

function TaskStatusChart({ done, inProgress, late }) {
  const total = done + inProgress + late;
  const doneEnd = total ? (done / total) * 360 : 0;
  const progressEnd = total ? doneEnd + (inProgress / total) * 360 : 0;
  const chartBackground = total
    ? `conic-gradient(${taskStatusColors.selesai} 0deg ${doneEnd}deg, ${taskStatusColors.proses} ${doneEnd}deg ${progressEnd}deg, ${taskStatusColors.terlambat} ${progressEnd}deg 360deg)`
    : "#e2e8f0";
  const items = [
    { label: "Selesai", value: done, color: taskStatusColors.selesai },
    { label: "Dalam proses", value: inProgress, color: taskStatusColors.proses },
    { label: "Terlambat", value: late, color: taskStatusColors.terlambat },
  ];

  return (
    <section className="surface-panel p-5 sm:p-6">
      <div>
        <h2 className="text-base font-bold text-slate-950">Status tugas</h2>
        <p className="mt-1 text-sm text-slate-500">Komposisi seluruh pekerjaan perusahaan.</p>
      </div>
      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
        <div
          className="relative h-44 w-44 shrink-0 rounded-full"
          style={{ background: chartBackground }}
          role="img"
          aria-label={`${done} tugas selesai, ${inProgress} dalam proses, ${late} terlambat`}
        >
          <div className="absolute inset-[22px] flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
            <span className="text-3xl font-bold tracking-tight text-slate-950">{total}</span>
            <span className="text-xs font-medium text-slate-500">Total tugas</span>
          </div>
        </div>
        <div className="w-full max-w-[220px] space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-slate-600">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DivisionPerformanceChart({ divisions, tasks }) {
  const rows = divisions.map((division) => {
    const divisionTasks = tasks.filter((task) => String(task.divisionId) === String(division.id));
    const value = divisionTasks.length
      ? Math.round(divisionTasks.reduce((sum, task) => sum + (Number(task.progress) || 0), 0) / divisionTasks.length)
      : 0;
    return { ...division, value, taskCount: divisionTasks.length };
  }).sort((a, b) => b.value - a.value);

  return (
    <section className="surface-panel p-5 sm:p-6">
      <div>
        <h2 className="text-base font-bold text-slate-950">Performa divisi</h2>
        <p className="mt-1 text-sm text-slate-500">Rata-rata progres tugas per divisi.</p>
      </div>
      <div className="mt-6 space-y-5">
        {rows.map((division) => (
          <div key={division.id}>
            <div className="mb-2 flex items-end justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-700">{division.name}</p>
                <p className="text-xs text-slate-400">{division.taskCount} tugas</p>
              </div>
              <span className="font-bold text-slate-900">{division.value}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-[width] duration-500"
                style={{ width: `${division.value}%` }}
              />
            </div>
          </div>
        ))}
        {!rows.length && <p className="py-8 text-center text-sm text-slate-400">Belum ada data divisi.</p>}
      </div>
    </section>
  );
}

export default function OwnerDashboard() {
  const user = getCurrentUser();
  const isAdministrator = user?.role === "Administrator";
  const { divisions, employees, tasks, taskSubmissions, activityLogs, employeeName, loading, error } = useAppData();
  const done = tasks.filter((task) => task.status === "Selesai").length;
  const late = tasks.filter((task) => task.status === "Terlambat").length;
  const inProgress = Math.max(tasks.length - done - late, 0);
  const progress = tasks.length
    ? Math.round(tasks.reduce((sum, task) => sum + (Number(task.progress) || 0), 0) / tasks.length)
    : 0;
  const totalStaff = employees.filter((employee) => !["Owner", "Administrator"].includes(employee.role)).length;
  const employeeRole = (id) => employees.find((employee) => String(employee.id) === String(id))?.role || "Staff";
  const reviewStats = submissionStats(buildSubmissionRows(tasks, taskSubmissions, { employeeName, employeeRole }));
  const needsAttention = late + reviewStats.revision + reviewStats.waitingReview;

  return (
    <div className="space-y-7">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}

      <section className="owner-hero relative overflow-hidden rounded-2xl px-5 py-7 text-white shadow-xl shadow-navy-900/15 sm:px-7">
        <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Executive overview</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{isAdministrator ? "Dashboard Admin" : "Dashboard Owner"}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/90">Ringkasan kondisi perusahaan dan pekerjaan yang perlu perhatian Anda.</p>
          </div>
          <div className="rounded-xl bg-white/10 px-5 py-3 ring-1 ring-white/15 backdrop-blur-sm">
            <p className="text-xs font-medium text-blue-100">Progress perusahaan</p>
            <p className="mt-1 text-3xl font-bold">{progress}%</p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-950">Angka utama</h2>
          <p className="mt-1 text-sm text-slate-500">Informasi terpenting untuk keputusan cepat.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Staf" value={totalStaff} icon={Users} tone="purple" />
          <StatCard title="Tugas Dalam Proses" value={inProgress} icon={Clock} tone="blue" />
          <StatCard title="Tugas Selesai" value={done} icon={CheckCircle2} tone="green" />
          <StatCard title="Perlu Perhatian" value={needsAttention} icon={AlertTriangle} tone="red" />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <TaskStatusChart done={done} inProgress={inProgress} late={late} />
        <DivisionPerformanceChart divisions={divisions} tasks={tasks} />
      </div>

      <section className="surface-panel p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Aktivitas terbaru</h2>
            <p className="mt-1 text-sm text-slate-500">Empat pembaruan terakhir dari tim.</p>
          </div>
          {(reviewStats.waitingReview > 0 || reviewStats.revision > 0) && (
            <p className="text-sm font-medium text-amber-700">
              {reviewStats.waitingReview} menunggu review · {reviewStats.revision} revisi
            </p>
          )}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {activityLogs.slice(0, 4).map((log) => {
            const status = log.severity === "danger" ? "Terlambat" : log.severity === "owner" ? "Owner" : log.severity === "warning" ? "Pending" : "Selesai";
            return (
              <div key={log.id} className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
                <p className="text-sm leading-6 text-slate-600"><span className="font-semibold text-slate-900">{log.actor}</span> {log.action}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">{log.time}</span>
                  <Badge>{status}</Badge>
                </div>
              </div>
            );
          })}
          {!activityLogs.length && <p className="py-8 text-sm text-slate-400">Belum ada aktivitas terbaru.</p>}
        </div>
      </section>
    </div>
  );
}
