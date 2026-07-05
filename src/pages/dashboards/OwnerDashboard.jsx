import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import Badge from "../../components/Badge";
import StatCard from "../../components/StatCard";
import { useAppData } from "../../data/AppDataProvider";
import { getCurrentUser } from "../../utils/auth";
import { buildSubmissionRows, submissionStats } from "../../utils/submissions";

const taskStatusColors = {
  selesai: "#10b981",
  proses: "#2563eb",
  terlambat: "#f43f5e",
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const daysUntil = (date) => {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(date);
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline - today) / 86400000);
};

const deadlineLabel = (date) => {
  const remaining = daysUntil(date);
  if (remaining === null) return "Tanpa deadline";
  if (remaining < 0) return `Terlambat ${Math.abs(remaining)} hari`;
  if (remaining === 0) return "Deadline hari ini";
  if (remaining === 1) return "Besok";
  return `${remaining} hari lagi`;
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
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
          <BarChart3 size={22} />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-950">Status Tugas</h2>
          <p className="mt-1 text-sm text-slate-500">Komposisi pekerjaan seluruh perusahaan.</p>
        </div>
      </div>
      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
        <div
          className="relative h-44 w-44 shrink-0 rounded-full shadow-inner"
          style={{ background: chartBackground }}
          role="img"
          aria-label={`${done} tugas selesai, ${inProgress} dalam proses, ${late} terlambat`}
        >
          <div className="absolute inset-[22px] flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
            <span className="text-3xl font-bold tracking-tight text-slate-950">{total}</span>
            <span className="text-xs font-medium text-slate-500">Total tugas</span>
          </div>
        </div>
        <div className="w-full max-w-[240px] space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2">
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
  const rows = divisions
    .map((division) => {
      const divisionTasks = tasks.filter((task) => String(task.divisionId) === String(division.id));
      const value = divisionTasks.length
        ? Math.round(divisionTasks.reduce((sum, task) => sum + (Number(task.progress) || 0), 0) / divisionTasks.length)
        : 0;
      const late = divisionTasks.filter((task) => task.status === "Terlambat" || daysUntil(task.deadline) < 0).length;
      return { ...division, value, taskCount: divisionTasks.length, late };
    })
    .sort((a, b) => b.value - a.value);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <TrendingUp size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-950">Performa Divisi</h2>
            <p className="mt-1 text-sm text-slate-500">Rata-rata progres tugas per divisi.</p>
          </div>
        </div>
        <Link to="/divisions" className="hidden text-sm font-semibold text-navy-700 hover:underline sm:inline">Lihat Divisi</Link>
      </div>
      <div className="mt-6 space-y-5">
        {rows.map((division) => (
          <div key={division.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-end justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-800">{division.name}</p>
                <p className="mt-1 text-xs text-slate-500">{division.taskCount} tugas • {division.late} terlambat</p>
              </div>
              <span className="font-bold text-slate-950">{division.value}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
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
  const isDeputyOwner = user?.role === "Wakil Owner";
  const isDeveloper = user?.role === "Developer";
  const isAdmin = user?.role === "Administrator";
  const { divisions, employees, tasks, taskSubmissions, activityLogs, employeeName, loading, error } = useAppData();
  const done = tasks.filter((task) => task.status === "Selesai" || task.approval === "Approved").length;
  const late = tasks.filter((task) => task.status === "Terlambat" || daysUntil(task.deadline) < 0).length;
  const inProgress = Math.max(tasks.length - done - late, 0);
  const progress = tasks.length
    ? Math.round(tasks.reduce((sum, task) => sum + (Number(task.progress) || 0), 0) / tasks.length)
    : 0;
  const totalStaff = employees.filter((employee) => !["Owner", "Wakil Owner", "Developer", "Administrator"].includes(employee.role)).length;
  const limitedEmployeeAccess = (user?.role === "Owner" || user?.role === "Wakil Owner" || user?.role === "Developer") && employees.length > 0 && employees.length < 10;
  const employeeRole = (id) => employees.find((employee) => String(employee.id) === String(id))?.role || "Staff";
  const reviewRows = buildSubmissionRows(tasks, taskSubmissions, { employeeName, employeeRole });
  const reviewStats = submissionStats(reviewRows);
  const reviewQueueCount = reviewStats.waitingReview + reviewStats.resentRevision;
  const needsAttention = late + reviewStats.revision + reviewQueueCount;
  const roleTitle = isDeveloper ? "Dashboard Developer" : isAdmin ? "Dashboard Admin" : isDeputyOwner ? "Dashboard Wakil Owner" : "Dashboard Owner";

  const attentionTasks = [...tasks]
    .filter((task) => task.status === "Terlambat" || task.status === "Revisi" || task.approval === "Revisi" || daysUntil(task.deadline) < 0)
    .sort((a, b) => new Date(a.deadline || "2999-12-31") - new Date(b.deadline || "2999-12-31"))
    .slice(0, 4);

  const reviewQueue = reviewRows
    .filter((row) => ["Menunggu Review", "Revisi Dikirim Ulang", "Terlambat"].includes(row.status))
    .sort((a, b) => new Date(a.deadline || "2999-12-31") - new Date(b.deadline || "2999-12-31"))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      {limitedEmployeeAccess && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Data staf yang terbaca belum lengkap. Logout lalu login ulang agar role terbaru tersinkron.
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-navy-900 to-blue-800 p-6 text-white shadow-sm shadow-slate-200/80">
        <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              Executive Overview
            </p>
            <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">{roleTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50">
              Ringkasan kondisi perusahaan, performa divisi, dan pekerjaan yang perlu keputusan cepat.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[380px]">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-medium text-blue-100">Progress perusahaan</p>
              <p className="mt-1 text-3xl font-bold">{progress}%</p>
              <div className="mt-4 h-2 rounded-full bg-white/20">
                <div className="h-2 rounded-full bg-white" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-medium text-blue-100">Perlu keputusan</p>
              <p className="mt-1 text-3xl font-bold">{needsAttention}</p>
              <p className="mt-4 text-xs text-blue-100">Review, revisi, dan deadline</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Divisi" value={divisions.length} icon={Building2} tone="blue" />
        <StatCard title="Total Staf" value={totalStaff} icon={Users} tone="purple" />
        <StatCard title="Menunggu Review" value={reviewQueueCount} icon={Clock3} tone="yellow" />
        <StatCard title="Tugas Terlambat" value={late} icon={AlertTriangle} tone="red" />
        <StatCard title="Tugas Selesai" value={done} icon={CheckCircle2} tone="green" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <TaskStatusChart done={done} inProgress={inProgress} late={late} />
        <DivisionPerformanceChart divisions={divisions} tasks={tasks} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Butuh Perhatian Management</h2>
              <p className="mt-1 text-sm text-slate-500">Tugas terlambat atau revisi aktif.</p>
            </div>
            <Link
              to="/division-jobdesk"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-800"
            >
              Lihat Jobdesk
              <ChevronRight size={16} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {attentionTasks.length ? (
              attentionTasks.map((task) => (
                <Link key={task.id} to={`/jobdesk/${task.id}`} className="block p-5 transition hover:bg-slate-50">
                  <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-950">{task.title}</h3>
                          <Badge>{task.status}</Badge>
                          <Badge>{task.priority}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {employeeName(task.assigneeId)} • {task.divisionId}
                        </p>
                      </div>
                      <div className="shrink-0 rounded-2xl border border-white bg-white px-4 py-3 text-sm">
                        <p className="font-semibold text-slate-950">{formatDate(task.deadline)}</p>
                        <p className={`mt-1 text-xs font-semibold ${daysUntil(task.deadline) < 0 ? "text-rose-700" : "text-slate-500"}`}>
                          {deadlineLabel(task.deadline)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="mt-3 font-bold text-slate-900">Kondisi aman</h3>
                <p className="mt-1 text-sm text-slate-500">Tidak ada tugas terlambat atau revisi aktif.</p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                <FileCheck2 size={22} />
              </div>
              <div>
                <h2 className="font-bold text-slate-950">Antrian Review</h2>
                <p className="text-sm text-slate-500">Drive yang menunggu approve/revisi</p>
              </div>
            </div>
            <Link to="/reviews" className="text-sm font-semibold text-navy-700 hover:underline">Buka</Link>
          </div>

          <div className="mt-4 space-y-3">
            {reviewQueue.length ? (
              reviewQueue.map((row) => (
                <Link key={row.id} to="/reviews" className="block rounded-2xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-amber-200 hover:bg-amber-50/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{row.taskTitle}</p>
                      <p className="mt-1 text-xs text-slate-500">{row.staffName} • {formatDate(row.deadline)}</p>
                    </div>
                    <Badge>{row.status}</Badge>
                  </div>
                </Link>
              ))
            ) : (
              <p className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
                Tidak ada pengumpulan yang menunggu review.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Aktivitas Terbaru</h2>
            <p className="mt-1 text-sm text-slate-500">Pembaruan terakhir dari tim dan sistem.</p>
          </div>
          {(reviewQueueCount > 0 || reviewStats.revision > 0) && (
            <p className="text-sm font-medium text-amber-700">
              {reviewQueueCount} menunggu review · {reviewStats.revision} revisi
            </p>
          )}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {activityLogs.slice(0, 4).map((log) => {
            const status = log.severity === "danger" ? "Terlambat" : log.severity === "owner" ? "Owner" : log.severity === "warning" ? "Pending" : "Selesai";
            return (
              <div key={log.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
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
