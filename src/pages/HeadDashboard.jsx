import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import Badge from "../components/Badge";
import ProgressBar from "../components/ProgressBar";
import StatCard from "../components/StatCard";
import { useAppData } from "../data/AppDataProvider";
import { getCurrentUser } from "../utils/auth";
import { buildSubmissionRows, submissionStats } from "../utils/submissions";

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

const attentionTone = (task) => {
  if (task.status === "Terlambat" || daysUntil(task.deadline) < 0) return "border-rose-200 bg-rose-50/70";
  if (task.status === "Revisi" || task.approval === "Revisi") return "border-amber-200 bg-amber-50/70";
  if (task.status === "Selesai" || task.approval === "Approved") return "border-emerald-200 bg-emerald-50/70";
  return "border-slate-200 bg-white";
};

export default function HeadDashboard() {
  const user = getCurrentUser();
  const { employees, tasks, taskSubmissions, minutes, divisionName, employeeName, scopedByDivision, loading, error } = useAppData();
  if (!user) return <div className="surface-panel p-4 text-sm text-slate-500">Memuat profil...</div>;

  const divisionTasks = scopedByDivision(tasks, user);
  const members = scopedByDivision(employees, user).filter((employee) => !["Owner", "Wakil Owner", "Developer", "Administrator"].includes(employee.role));
  const staffMembers = members.filter((employee) => ["Staff", "Magang"].includes(employee.role));
  const latestMinutes = scopedByDivision(minutes, user).slice(0, 3);
  const employeeRole = (id) => employees.find((employee) => String(employee.id) === String(id))?.role || "Staff";
  const reviewRows = buildSubmissionRows(divisionTasks, taskSubmissions, { employeeName, employeeRole });
  const reviewStats = submissionStats(reviewRows);

  const completedTasks = divisionTasks.filter((task) => task.status === "Selesai" || task.approval === "Approved").length;
  const activeTasks = divisionTasks.length - completedTasks;
  const lateTasks = divisionTasks.filter((task) => task.status === "Terlambat" || daysUntil(task.deadline) < 0).length;
  const revisionTasks = divisionTasks.filter((task) => task.status === "Revisi" || task.approval === "Revisi").length;
  const averageProgress = divisionTasks.length
    ? Math.round(divisionTasks.reduce((total, task) => total + Number(task.progress || 0), 0) / divisionTasks.length)
    : 0;

  const reviewQueue = reviewRows
    .filter((row) => ["Menunggu Review", "Revisi Dikirim Ulang", "Terlambat"].includes(row.status))
    .sort((a, b) => new Date(a.deadline || "2999-12-31") - new Date(b.deadline || "2999-12-31"))
    .slice(0, 4);

  const priorityTasks = [...divisionTasks]
    .filter((task) => task.status !== "Selesai" && task.approval !== "Approved")
    .sort((a, b) => {
      const lateSort = Number(daysUntil(a.deadline) < 0) - Number(daysUntil(b.deadline) < 0);
      if (lateSort) return -lateSort;
      return new Date(a.deadline || "2999-12-31") - new Date(b.deadline || "2999-12-31");
    })
    .slice(0, 5);

  const divisionLabel = user.divisionId === "all" ? "Semua Divisi" : divisionName(user.divisionId);

  return (
    <div className="space-y-6">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-navy-900 to-blue-800 p-6 text-white shadow-sm shadow-slate-200/80">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              Dashboard Kepala Divisi
            </p>
            <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">{divisionLabel}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50">
              Pantau progres anggota, review pengumpulan Drive, dan tindak cepat tugas yang terlambat atau butuh revisi.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-medium text-blue-100">Progress divisi</p>
              <p className="mt-1 text-3xl font-bold">{averageProgress}%</p>
              <div className="mt-4 h-2 rounded-full bg-white/20">
                <div className="h-2 rounded-full bg-white" style={{ width: `${averageProgress}%` }} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-medium text-blue-100">Antrian review</p>
              <p className="mt-1 text-3xl font-bold">{reviewStats.waitingReview + reviewStats.resentRevision}</p>
              <p className="mt-4 text-xs text-blue-100">Butuh keputusan approve/revisi</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Anggota Divisi" value={staffMembers.length} icon={Users} tone="blue" />
        <StatCard title="Tugas Aktif" value={activeTasks} icon={FileText} tone="purple" />
        <StatCard title="Menunggu Review" value={reviewStats.waitingReview + reviewStats.resentRevision} icon={Clock3} tone="yellow" />
        <StatCard title="Perlu Revisi" value={revisionTasks + reviewStats.revision} icon={AlertTriangle} tone="red" />
        <StatCard title="Tugas Selesai" value={completedTasks} icon={CheckCircle2} tone="green" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Tugas yang Perlu Dipantau</h2>
              <p className="mt-1 text-sm text-slate-500">Prioritas berdasarkan deadline, revisi, dan keterlambatan.</p>
            </div>
            <Link
              to="/division-jobdesk"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-800"
            >
              Kelola Jobdesk
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {priorityTasks.length ? (
              priorityTasks.map((task) => (
                <Link key={task.id} to={`/jobdesk/${task.id}`} className="group block p-5 transition hover:bg-slate-50">
                  <div className={`rounded-2xl border p-4 transition group-hover:border-blue-200 ${attentionTone(task)}`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-950">{task.title}</h3>
                          <Badge>{task.priority}</Badge>
                          <Badge>{task.status}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          {employeeName(task.assigneeId)} • diberikan oleh {task.assignedByName || task.assignedBy}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{task.description}</p>
                      </div>
                      <div className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                        <p className="font-semibold text-slate-950">{formatDate(task.deadline)}</p>
                        <p className={`mt-1 text-xs font-semibold ${daysUntil(task.deadline) < 0 ? "text-rose-700" : "text-slate-500"}`}>
                          {deadlineLabel(task.deadline)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <ProgressBar value={task.progress} />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="mt-3 font-bold text-slate-900">Tidak ada tugas aktif</h3>
                <p className="mt-1 text-sm text-slate-500">Semua tugas divisi sudah selesai atau belum ada jobdesk baru.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                  <ClipboardCheck size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-950">Antrian Review</h2>
                  <p className="text-sm text-slate-500">Drive yang perlu dicek</p>
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

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">
                <CalendarClock size={22} />
              </div>
              <div>
                <h2 className="font-bold text-slate-950">Risiko Deadline</h2>
                <p className="text-sm text-slate-500">{lateTasks ? `${lateTasks} tugas terlambat` : "Deadline aman"}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-2xl font-bold text-rose-700">{lateTasks}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Terlambat</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-2xl font-bold text-amber-700">{revisionTasks}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Revisi Aktif</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <BarChart3 size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-950">Notulen Terbaru</h2>
                  <p className="text-sm text-slate-500">Keputusan rapat divisi</p>
                </div>
              </div>
              <Link to="/minutes" className="text-sm font-semibold text-navy-700 hover:underline">Buka</Link>
            </div>
            <div className="mt-4 space-y-3">
              {latestMinutes.length ? (
                latestMinutes.map((minute) => (
                  <Link key={minute.id} to={`/minutes/${minute.id}`} className="block rounded-2xl border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/40">
                    <p className="text-sm font-semibold text-slate-900">{minute.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(minute.date)} • {minute.time}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{minute.decision}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500">Belum ada notulen untuk divisi ini.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
