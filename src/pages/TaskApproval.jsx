import { useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import { getCurrentUser } from "../utils/auth";
import { useAppData } from "../data/AppDataProvider";
import { Page } from "./Divisions";

export default function TaskApproval() {
  const user = getCurrentUser();
  const { tasks, divisionName, employeeName, scopedByDivision, loading, error } = useAppData();
  const [statuses, setStatuses] = useState({});
  const rows = scopedByDivision(tasks, user).filter((task) => task.approval !== "Approved");

  return (
    <Page title="Approval Tugas" subtitle="Daftar tugas yang menunggu approval, approve, dan revisi.">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      <DataTable
        rows={rows}
        columns={[
          { key: "title", header: "Tugas" },
          { key: "assigneeId", header: "Staff", render: (row) => employeeName(row.assigneeId) },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "assignedBy", header: "Dari", render: (row) => <Badge>{row.assignedBy}</Badge> },
          { key: "approval", header: "Status Approval", render: (row) => <Badge>{statuses[row.id] || row.approval}</Badge> },
          { key: "note", header: "Catatan Revisi", render: (row) => <span className="block max-w-sm whitespace-normal">{row.note}</span> },
          { key: "actions", header: "Aksi", render: (row) => (
            <div className="flex gap-2">
              <button onClick={() => setStatuses({ ...statuses, [row.id]: "Approved" })} className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Approve</button>
              <button onClick={() => setStatuses({ ...statuses, [row.id]: "Revisi" })} className="rounded bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white">Revisi</button>
            </div>
          ) },
        ]}
      />
    </Page>
  );
}
