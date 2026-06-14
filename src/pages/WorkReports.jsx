import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { useState } from "react";
import { Activity, AlertTriangle, BarChart3, CheckCircle2, ClipboardList, Target } from "lucide-react";
import { getCurrentUser } from "../utils/auth";
import { detectPerformance } from "../utils/helpers";
import { Page } from "./Divisions";
import StatCard from "../components/StatCard";
import ProgressBar from "../components/ProgressBar";
import { useAppData } from "../data/AppDataProvider";

export default function WorkReports() {
  const user = getCurrentUser();
  const { reports, weeklyReports, divisionName, scopedByDivision, loading, error } = useAppData();
  const [open, setOpen] = useState(false);
  const rows = user.role === "Staff" && user.divisionId !== "all" ? reports.filter((report) => report.staff === user.name) : scopedByDivision(reports, user);
  const weeklyRows = user.role === "Staff" && user.divisionId !== "all" ? weeklyReports.filter((report) => report.staff === user.name) : scopedByDivision(weeklyReports, user);
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
    <Page title="Laporan Kerja" subtitle="Laporan harian, laporan mingguan, statistik, dan deteksi kinerja otomatis." action={<button onClick={() => setOpen(true)} className="rounded-lg bg-navy-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-900">Kirim Laporan</button>}>
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
      <Modal open={open} title="Form Laporan Kerja" onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <select className="rounded-lg border border-slate-200 px-3 py-2"><option>Laporan Harian</option><option>Laporan Mingguan</option></select>
          <input className="rounded-lg border border-slate-200 px-3 py-2" placeholder="Target tugas minggu ini" />
          <input className="rounded-lg border border-slate-200 px-3 py-2" placeholder="Tugas selesai" />
          <textarea className="rounded-lg border border-slate-200 px-3 py-2" placeholder="Pekerjaan yang sudah dilakukan" />
          <textarea className="rounded-lg border border-slate-200 px-3 py-2" placeholder="Kendala" />
          <textarea className="rounded-lg border border-slate-200 px-3 py-2" placeholder="Rencana berikutnya" />
          <button className="rounded-lg bg-navy-800 px-4 py-2 font-semibold text-white">Kirim</button>
        </div>
      </Modal>
    </Page>
  );
}
