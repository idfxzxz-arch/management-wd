import { CheckCircle2, Clock, FileText, Users, XCircle } from "lucide-react";
import StatCard from "../components/StatCard";
import ProgressBar from "../components/ProgressBar";
import Badge from "../components/Badge";
import { getCurrentUser } from "../utils/auth";
import { divisionName, employeeName, scopedByDivision } from "../utils/helpers";
import { employees } from "../data/employees";
import { tasks } from "../data/tasks";
import { minutes } from "../data/minutes";

export default function HeadDashboard() {
  const user = getCurrentUser();
  const divisionTasks = scopedByDivision(tasks, user);
  const members = scopedByDivision(employees, user).filter((employee) => employee.role !== "Owner");
  const latestMinutes = scopedByDivision(minutes, user).slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Kepala Divisi</h1>
        <p className="mt-1 text-sm text-slate-500">{user.divisionId === "all" ? "Akun demo umum untuk 5 Kepala Divisi" : divisionName(user.divisionId)}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Jumlah Anggota" value={members.length} icon={Users} tone="blue" />
        <StatCard title="Total Jobdesk" value={divisionTasks.length} icon={FileText} tone="purple" />
        <StatCard title="Selesai" value={divisionTasks.filter((task) => task.status === "Selesai").length} icon={CheckCircle2} tone="green" />
        <StatCard title="Pending" value={divisionTasks.filter((task) => task.status !== "Selesai" && task.status !== "Terlambat").length} icon={Clock} tone="yellow" />
        <StatCard title="Terlambat" value={divisionTasks.filter((task) => task.status === "Terlambat").length} icon={XCircle} tone="red" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Progress Anggota Divisi</h2>
          <div className="mt-4 space-y-4">
            {divisionTasks.map((task) => (
              <div key={task.id} className="rounded border border-slate-100 p-3">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-800">{employeeName(task.assigneeId)}</p>
                    <p className="text-sm text-slate-500">{task.title}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge>{task.assignedBy}</Badge>
                    <Badge>{task.status}</Badge>
                  </div>
                </div>
                <ProgressBar value={task.progress} />
              </div>
            ))}
          </div>
        </section>
        <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Notulen Terbaru</h2>
          <div className="mt-4 space-y-3">
            {latestMinutes.map((minute) => (
              <div key={minute.id} className="rounded border border-slate-100 p-4">
                <p className="font-semibold text-slate-800">{minute.title}</p>
                <p className="mt-1 text-sm text-slate-500">{minute.date} - {minute.time}</p>
                <p className="mt-2 text-sm text-slate-600">{minute.decision}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
