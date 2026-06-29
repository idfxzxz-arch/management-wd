import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  Target,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import Badge from "../components/Badge";
import ProgressBar from "../components/ProgressBar";
import StatCard from "../components/StatCard";
import { useAppData } from "../data/AppDataProvider";
import { getCurrentUser } from "../utils/auth";

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
  if (remaining === null) return "Belum ada deadline";
  if (remaining < 0) return `Terlambat ${Math.abs(remaining)} hari`;
  if (remaining === 0) return "Deadline hari ini";
  if (remaining === 1) return "Besok";
  return `${remaining} hari lagi`;
};

const statusTone = (task) => {
  if (task.status === "Terlambat" || daysUntil(task.deadline) < 0) return "border-rose-200 bg-rose-50/70";
  if (task.approval === "Revisi" || task.status === "Revisi") return "border-amber-200 bg-amber-50/70";
  if (task.status === "Selesai" || task.approval === "Approved") return "border-emerald-200 bg-emerald-50/70";
  return "border-slate-200 bg-white";
};

export default function StaffDashboard() {
  const user = getCurrentUser();
  const { tasks, minutes, announcements, employeeName, loading, error } = useAppData();
  const personalTasks = tasks.filter((task) => String(task.assigneeId) === String(user.employeeId));
  const visibleMinutes = user.divisionId === "all" ? minutes : minutes.filter((minute) => minute.divisionId === user.divisionId);
  const roleLabel = user?.role === "Magang" ? "Magang" : "Staf";
  const displayName = user?.name || employeeName(user?.employeeId) || roleLabel;

  const activeTasks = personalTasks.filter((task) => !["Selesai", "Approved"].includes(task.status) && task.approval !== "Approved");
  const completedTasks = personalTasks.length - activeTasks.length;
  const waitingReview = personalTasks.filter((task) => ["Menunggu Review", "Revisi Dikirim Ulang"].includes(task.status) || task.approval === "Menunggu Review").length;
  const revisionTasks = personalTasks.filter((task) => task.status === "Revisi" || task.approval === "Revisi").length;
  const lateTasks = personalTasks.filter((task) => task.status === "Terlambat" || daysUntil(task.deadline) < 0).length;
  const averageProgress = personalTasks.length
    ? Math.round(personalTasks.reduce((total, task) => total + Number(task.progress || 0), 0) / personalTasks.length)
    : 0;

  const priorityTasks = [...personalTasks]
    .filter((task) => task.status !== "Selesai" && task.approval !== "Approved")
    .sort((a, b) => {
      const lateSort = Number(daysUntil(a.deadline) < 0) - Number(daysUntil(b.deadline) < 0);
      if (lateSort) return -lateSort;
      return new Date(a.deadline || "2999-12-31") - new Date(b.deadline || "2999-12-31");
    })
    .slice(0, 4);

  const latestAnnouncement = announcements[0];

  return (
    <div className="space-y-6">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-navy-900 via-navy-800 to-blue-700 p-6 text-white shadow-sm shadow-slate-200/80">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              Dashboard {roleLabel}
            </p>
            <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">Halo, {displayName}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50">
              Fokus hari ini: pantau progres, cek deadline, dan kirim link Drive jika tugas sudah siap direview.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-3">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-100">Progress rata-rata</p>
                <p className="text-3xl font-bold">{averageProgress}%</p>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/20">
              <div className="h-2 rounded-full bg-white" style={{ width: `${averageProgress}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tugas Aktif" value={activeTasks.length} icon={Target} tone="blue" />
        <StatCard title="Menunggu Review" value={waitingReview} icon={Clock3} tone="yellow" />
        <StatCard title="Perlu Revisi" value={revisionTasks} icon={AlertTriangle} tone="red" />
        <StatCard title="Tugas Selesai" value={completedTasks} icon={CheckCircle2} tone="green" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Prioritas Pekerjaan</h2>
              <p className="mt-1 text-sm text-slate-500">Urutan berdasarkan deadline dan status tugas.</p>
            </div>
            <Link
              to="/individual-jobdesk"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-800"
            >
              Lihat Semua
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {priorityTasks.length ? (
              priorityTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/jobdesk/${task.id}`}
                  className="group block p-5 transition hover:bg-slate-50"
                >
                  <div className={`rounded-2xl border p-4 transition group-hover:border-blue-200 ${statusTone(task)}`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-950">{task.title}</h3>
                          <Badge>{task.priority}</Badge>
                          <Badge>{task.status}</Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{task.description}</p>
                        {task.note && (
                          <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            Catatan: {task.note}
                          </p>
                        )}
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
                <p className="mt-1 text-sm text-slate-500">Semua pekerjaan sudah selesai atau belum ada jobdesk baru.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">
                <CalendarClock size={22} />
              </div>
              <div>
                <h2 className="font-bold text-slate-950">Deadline</h2>
                <p className="text-sm text-slate-500">{lateTasks ? `${lateTasks} tugas terlambat` : "Tidak ada yang terlambat"}</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {priorityTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                  <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(task.deadline)} • {deadlineLabel(task.deadline)}</p>
                </div>
              ))}
              {!priorityTasks.length && <p className="text-sm text-slate-500">Belum ada deadline aktif.</p>}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-950">Notulen</h2>
                  <p className="text-sm text-slate-500">{visibleMinutes.length} notulen tersedia</p>
                </div>
              </div>
              <Link to="/minutes" className="text-sm font-semibold text-navy-700 hover:underline">Buka</Link>
            </div>
            <div className="mt-4 space-y-3">
              {visibleMinutes.slice(0, 3).map((minute) => (
                <Link key={minute.id} to={`/minutes/${minute.id}`} className="block rounded-2xl border border-slate-100 p-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40">
                  {minute.title}
                </Link>
              ))}
              {!visibleMinutes.length && <p className="text-sm text-slate-500">Belum ada notulen untuk divisi ini.</p>}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
                <Bell size={22} />
              </div>
              <div>
                <h2 className="font-bold text-slate-950">Pengumuman</h2>
                <p className="text-sm text-slate-500">Informasi internal terbaru</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="font-semibold text-slate-900">{latestAnnouncement?.title || "Belum ada pengumuman"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {latestAnnouncement?.content || "Data akan muncul setelah pengumuman ditambahkan."}
              </p>
            </div>
          </section>

          <Link
            to="/reports"
            className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 transition hover:border-blue-200 hover:bg-blue-50/40"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <FileText size={22} />
              </div>
              <div>
                <p className="font-bold text-slate-950">Laporan Kerja</p>
                <p className="text-sm text-slate-500">Kirim update pekerjaan rutin</p>
              </div>
            </div>
            <ChevronRight className="text-slate-400" size={18} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
