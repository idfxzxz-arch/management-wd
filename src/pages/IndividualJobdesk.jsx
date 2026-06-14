import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import ProgressBar from "../components/ProgressBar";
import { tasks } from "../data/tasks";
import { getCurrentUser } from "../utils/auth";
import { contains, divisionName, employeeName, scopedByDivision } from "../utils/helpers";
import { Page, Search } from "./Divisions";

export default function IndividualJobdesk() {
  const user = getCurrentUser();
  const [query, setQuery] = useState("");
  const base = user.role === "Staff" && user.divisionId !== "all" ? tasks.filter((task) => task.assigneeId === user.id) : scopedByDivision(tasks, user);
  const rows = useMemo(() => base.filter((task) => contains(task.title + task.description + employeeName(task.assigneeId) + task.assignedByName, query)), [query, base]);

  return (
    <Page title="Jobdesk Individu" subtitle="Daftar tugas per karyawan lengkap dengan catatan kepala divisi.">
      <Search value={query} setValue={setQuery} placeholder="Cari tugas, karyawan, atau catatan" />
      <DataTable
        rows={rows}
        columns={[
          { key: "assigneeId", header: "Karyawan", render: (row) => employeeName(row.assigneeId) },
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
