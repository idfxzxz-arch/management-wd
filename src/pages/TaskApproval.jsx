import { useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import { tasks } from "../data/tasks";
import { getCurrentUser } from "../utils/auth";
import { divisionName, employeeName, scopedByDivision } from "../utils/helpers";
import { Page } from "./Divisions";

export default function TaskApproval() {
  const user = getCurrentUser();
  const [statuses, setStatuses] = useState({});
  const rows = scopedByDivision(tasks, user).filter((task) => task.approval !== "Approved");

  return (
    <Page title="Approval Tugas" subtitle="Daftar tugas yang menunggu approval, approve dummy, dan revisi dummy.">
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
