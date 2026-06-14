import { Activity, Building2, CheckCircle2, Clock, FileText, Users, XCircle } from "lucide-react";
import StatCard from "../components/StatCard";
import ProgressBar from "../components/ProgressBar";
import Badge from "../components/Badge";
import { divisions } from "../data/divisions";
import { employees } from "../data/employees";
import { tasks } from "../data/tasks";
import { minutes } from "../data/minutes";
import { activityLogs } from "../data/activityLogs";

export default function OwnerDashboard() {
  const done = tasks.filter((task) => task.status === "Selesai").length;
  const late = tasks.filter((task) => task.status === "Terlambat").length;
  const active = tasks.length - done;
  const progress = Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Owner</h1>
        <p className="mt-1 text-sm text-slate-500">Ringkasan performa seluruh WD Group Company.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Divisi" value={divisions.length} icon={Building2} tone="blue" />
        <StatCard title="Total Karyawan" value={employees.length} icon={Users} tone="purple" />
        <StatCard title="Tugas Aktif" value={active} icon={Clock} tone="yellow" />
        <StatCard title="Tugas Selesai" value={done} icon={CheckCircle2} tone="green" />
        <StatCard title="Tugas Terlambat" value={late} icon={XCircle} tone="red" />
        <StatCard title="Total Notulen" value={minutes.length} icon={FileText} tone="slate" />
        <StatCard title="Progress Perusahaan" value={`${progress}%`} icon={Activity} tone="green" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Grafik Dummy Performa Divisi</h2>
          <div className="mt-5 space-y-4">
            {divisions.map((division, index) => (
              <div key={division.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{division.name}</span>
                  <span className="text-slate-500">{[88, 81, 64, 78, 90][index]}%</span>
                </div>
                <div className="h-3 rounded bg-slate-200">
                  <div className="h-3 rounded bg-navy-700" style={{ width: `${[88, 81, 64, 78, 90][index]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Aktivitas Terbaru</h2>
          <div className="mt-4 space-y-3">
            {activityLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="rounded border border-slate-100 p-3">
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
      <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Statistik Progress Perusahaan</h2>
        <ProgressBar value={progress} />
      </section>
    </div>
  );
}
