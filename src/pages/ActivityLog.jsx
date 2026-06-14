import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import { activityLogs } from "../data/activityLogs";
import { divisionName } from "../utils/helpers";
import { Page } from "./Divisions";

export default function ActivityLog() {
  return (
    <Page title="Activity Log" subtitle="Riwayat aktivitas sistem internal WD Group.">
      <DataTable
        rows={activityLogs}
        columns={[
          { key: "time", header: "Waktu" },
          { key: "actor", header: "Aktor" },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "action", header: "Aktivitas", render: (row) => <span className="block max-w-xl whitespace-normal">{row.action}</span> },
          { key: "severity", header: "Kategori", render: (row) => <Badge>{row.severity === "danger" ? "Terlambat" : row.severity === "owner" ? "Owner" : row.severity === "warning" ? "Pending" : "Selesai"}</Badge> },
        ]}
      />
    </Page>
  );
}
