import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import Badge from "../../components/Badge";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import ProgressBar from "../../components/ProgressBar";
import { getCurrentUser } from "../../utils/auth";
import { contains } from "../../utils/helpers";
import { Page, Search } from "../../components/PageShell";
import { useAppData } from "../../data/AppDataProvider";

export default function IndividualJobdesk() {
  const user = getCurrentUser();
  const { tasks, divisionName, employeeName, loading, error } = useAppData();
  const [query, setQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const base = tasks.filter((task) => String(task.assigneeId) === String(user.employeeId));
  const rows = useMemo(() => base.filter((task) => contains(task.title + task.description + employeeName(task.assigneeId) + task.assignedByName, query)), [query, base]);

  return (
    <Page title="Jobdesk Individu" subtitle="Daftar tugas pribadi berdasarkan akun login masing-masing.">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      <Search value={query} setValue={setQuery} placeholder="Cari tugas, staf, atau catatan" />
      <DataTable
        rows={rows}
        minWidth="760px"
        columns={[
          { key: "assigneeId", header: "PIC", width: "140px", contentClassName: "font-medium text-slate-900", render: (row) => employeeName(row.assigneeId) },
          { key: "divisionId", header: "Divisi", width: "180px", render: (row) => divisionName(row.divisionId) },
          { key: "title", header: "Judul Tugas", width: "280px", contentClassName: "font-medium text-slate-900", render: (row) => <TaskPreview value={row.title} /> },
          { key: "deadline", header: "Deadline", width: "120px" },
          {
            key: "status",
            header: "Status",
            width: "200px",
            render: (row) => <TaskStatusCell task={row} />,
          },
          {
            key: "actions",
            header: "Aksi",
            width: "88px",
            cellClassName: "align-middle",
            render: (row) => (
              <button
                type="button"
                title="Lihat detail jobdesk"
                aria-label={`Lihat detail jobdesk ${row.title}`}
                onClick={() => setSelectedTask(row)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <Eye size={16} />
              </button>
            ),
          },
        ]}
      />
      <Modal open={Boolean(selectedTask)} title="Detail Jobdesk" onClose={() => setSelectedTask(null)} size="lg">
        {selectedTask && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <TaskInfo label="PIC" value={employeeName(selectedTask.assigneeId)} />
              <TaskInfo label="Divisi" value={divisionName(selectedTask.divisionId)} />
              <TaskInfo label="Deadline" value={selectedTask.deadline} />
              <TaskInfo label="Prioritas" value={<Badge>{selectedTask.priority}</Badge>} />
              <TaskInfo label="Status" value={<Badge>{selectedTask.status}</Badge>} />
              <TaskInfo label="Dari" value={<Badge>{selectedTask.assignedBy}</Badge>} />
            </div>
            <TaskTextBlock label="Judul Tugas" value={selectedTask.title} />
            <TaskTextBlock label="Deskripsi" value={selectedTask.description} />
            <TaskTextBlock label="Catatan" value={selectedTask.note} />
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase text-slate-400">Progress</p>
                <p className="text-sm font-bold text-slate-900">{selectedTask.progress}%</p>
              </div>
              <ProgressBar value={selectedTask.progress} />
            </section>
            <Link className="inline-flex rounded-lg bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-900" to={`/jobdesk/${selectedTask.id}`}>
              Buka Detail Jobdesk
            </Link>
          </div>
        )}
      </Modal>
    </Page>
  );
}

function TaskPreview({ value }) {
  return <span className="cell-clamp text-slate-700" title={value || ""}>{value || "-"}</span>;
}

function TaskStatusCell({ task }) {
  return (
    <div className="min-w-[170px] rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{task.status}</p>
          <p className="mt-0.5 text-[11px] font-bold uppercase text-slate-400">{task.priority}</p>
        </div>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{task.progress}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${progressColor(task)}`} style={{ width: `${task.progress || 0}%` }} />
      </div>
    </div>
  );
}

function progressColor(task) {
  if (task.status === "Terlambat") return "bg-rose-500";
  if (task.status === "Selesai" || task.progress >= 100) return "bg-emerald-600";
  if (task.status === "Proses") return "bg-blue-500";
  if (task.status === "Menunggu Review") return "bg-amber-500";
  return "bg-emerald-500";
}

function TaskInfo({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <div className="mt-1 min-w-0 break-words text-sm font-semibold text-slate-800">{value || "-"}</div>
    </div>
  );
}

function TaskTextBlock({ label, value }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{value || "-"}</p>
    </section>
  );
}
