import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import Badge from "../../components/Badge";
import { getCurrentUser } from "../../utils/auth";
import { contains } from "../../utils/helpers";
import { Page, Search } from "../../components/PageShell";
import { useAppData } from "../../data/AppDataProvider";

export default function IndividualJobdesk() {
  const user = getCurrentUser();
  const { tasks, divisionName, employeeName, loading, error } = useAppData();
  const [query, setQuery] = useState("");
  const base = tasks.filter((task) => String(task.assigneeId) === String(user.employeeId));
  const rows = useMemo(() => base.filter((task) => contains(task.title + task.description + employeeName(task.assigneeId) + task.assignedByName, query)), [query, base]);

  return (
    <Page title="Jobdesk Individu" subtitle="Daftar tugas pribadi berdasarkan akun login masing-masing.">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      <Search value={query} setValue={setQuery} placeholder="Cari tugas, staf, atau catatan" />
      <TaskList rows={rows} divisionName={divisionName} employeeName={employeeName} />
    </Page>
  );
}

function TaskList({ rows, divisionName, employeeName }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
      {rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">Data tidak ditemukan</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <Link
              key={row.id}
              to={`/jobdesk/${row.id}`}
              className="grid gap-3 px-4 py-3.5 transition hover:bg-slate-50 sm:px-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center"
            >
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h2 className="min-w-0 truncate text-sm font-semibold text-navy-800">{row.title}</h2>
                  <Badge>{row.assignedBy}</Badge>
                </div>
                <p className="mt-1 truncate text-sm text-slate-500">{row.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                  <span className="font-medium text-slate-500">{employeeName(row.assigneeId)}</span>
                  <span>{divisionName(row.divisionId)}</span>
                  <span>Deadline {row.deadline}</span>
                  {row.note && <span className="max-w-full truncate sm:max-w-[360px]">Catatan: {row.note}</span>}
                </div>
              </div>

              <div className="min-w-0 space-y-2 lg:text-right">
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Badge>{row.priority}</Badge>
                  <Badge>{row.status}</Badge>
                </div>
                <MiniProgress value={row.progress} />
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-1 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>{rows.length} data ditampilkan</span>
        <span>WD Group Internal Management</span>
      </div>
    </section>
  );
}

function MiniProgress({ value = 0 }) {
  return (
    <div className="flex items-center gap-2 lg:justify-end">
      <div className="h-1.5 w-full rounded-full bg-slate-200 lg:w-36">
        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-semibold text-slate-500">{value}%</span>
    </div>
  );
}
