import { Bell, Briefcase, CalendarClock, ClipboardList } from "lucide-react";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import ProgressBar from "../components/ProgressBar";
import { getCurrentUser } from "../utils/auth";
import { useAppData } from "../data/AppDataProvider";

export default function StaffDashboard() {
  const user = getCurrentUser();
  const { tasks, minutes, announcements, employeeName, loading, error } = useAppData();
  const personalTasks = tasks.filter((task) => String(task.assigneeId) === String(user.employeeId));
  const nearest = [...personalTasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];
  const unreadMinutes = user.divisionId === "all" ? minutes : minutes.filter((minute) => minute.divisionId === user.divisionId);
  const roleLabel = user?.role === "Magang" ? "Magang" : "Staff";

  return (
    <div className="space-y-6">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard {roleLabel}</h1>
        <p className="mt-1 text-sm text-slate-500">Ringkasan pekerjaan {roleLabel.toLowerCase()} dan informasi internal.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title={`Jobdesk ${roleLabel}`} value={personalTasks.length} icon={Briefcase} tone="blue" />
        <StatCard title="Deadline Terdekat" value={nearest?.deadline || "-"} icon={CalendarClock} tone="red" />
        <StatCard title="Notulen Dibaca" value={unreadMinutes.length} icon={ClipboardList} tone="yellow" />
        <StatCard title="Pengumuman Baru" value={announcements.length} icon={Bell} tone="purple" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Status Pekerjaan</h2>
          <div className="mt-4 space-y-4">
            {personalTasks.map((task) => (
              <div key={task.id} className="rounded border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{employeeName(task.assigneeId)} - {task.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge>{task.assignedBy}</Badge>
                    <Badge>{task.status}</Badge>
                  </div>
                </div>
                <div className="mt-4">
                  <ProgressBar value={task.progress} />
                </div>
                <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">Catatan kepala divisi: {task.note}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Notulen yang Perlu Dibaca</h2>
            <div className="mt-3 space-y-3">
              {unreadMinutes.map((minute) => (
                <p key={minute.id} className="rounded border border-slate-100 p-3 text-sm text-slate-700">{minute.title}</p>
              ))}
            </div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Pengumuman Terbaru</h2>
            <p className="mt-3 text-sm font-medium text-slate-800">{announcements[0]?.title || "Belum ada pengumuman"}</p>
            <p className="mt-1 text-sm text-slate-500">{announcements[0]?.content || "Data akan muncul setelah pengumuman ditambahkan."}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
