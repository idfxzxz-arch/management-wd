import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import ProgressBar from "../components/ProgressBar";
import { getCurrentUser } from "../utils/auth";
import { contains } from "../utils/helpers";
import { Page, Search } from "./Divisions";
import { useAppData } from "../data/AppDataProvider";

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
        columns={[
          { key: "assigneeId", header: "PIC", render: (row) => employeeName(row.assigneeId) },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "assignedBy", header: "Dari", render: (row) => <Badge>{row.assignedBy}</Badge> },
          { key: "title", header: "Judul Tugas", render: (row) => <Link className="font-semibold text-navy-700 hover:underline" to={`/jobdesk/${row.id}`}>{row.title}</Link> },
          { key: "description", header: "Deskripsi", width: "260px", render: (row) => <span className="cell-clamp">{row.description}</span> },
          { key: "deadline", header: "Deadline" },
          {
            key: "status",
            header: "Status",
            width: "190px",
            render: (row) => (
              <div className="min-w-[170px] space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge>{row.priority}</Badge>
                  <Badge>{row.status}</Badge>
                </div>
                <ProgressBar value={row.progress} />
              </div>
            ),
          },
          { key: "note", header: "Catatan", width: "240px", render: (row) => <span className="cell-clamp">{row.note}</span> },
        ]}
      />
    </Page>
  );
}
