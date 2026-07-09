import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import Badge from "../../components/Badge";
import DataTable from "../../components/DataTable";
import ProgressBar from "../../components/ProgressBar";
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
      <DataTable
        rows={rows}
        minWidth="760px"
        columns={[
          {
            key: "task",
            header: "Tugas",
            width: "44%",
            wrap: true,
            render: (row) => (
              <div className="min-w-[240px] max-w-xl">
                <Link className="font-semibold leading-5 text-navy-700 hover:underline" to={`/jobdesk/${row.id}`}>{row.title}</Link>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{row.description}</p>
                {row.note && <p className="mt-2 line-clamp-1 text-xs text-slate-400">Catatan: {row.note}</p>}
              </div>
            ),
          },
          {
            key: "owner",
            header: "PIC & Divisi",
            width: "24%",
            render: (row) => (
              <div className="min-w-[170px]">
                <p className="font-semibold text-slate-800">{employeeName(row.assigneeId)}</p>
                <p className="mt-1 text-sm text-slate-500">{divisionName(row.divisionId)}</p>
                <div className="mt-2">
                  <Badge>{row.assignedBy}</Badge>
                </div>
              </div>
            ),
          },
          { key: "deadline", header: "Deadline", width: "120px", contentClassName: "font-medium text-slate-700" },
          {
            key: "status",
            header: "Status",
            width: "210px",
            render: (row) => (
              <div className="min-w-[180px] space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge>{row.priority}</Badge>
                  <Badge>{row.status}</Badge>
                </div>
                <ProgressBar value={row.progress} />
              </div>
            ),
          },
        ]}
      />
    </Page>
  );
}
