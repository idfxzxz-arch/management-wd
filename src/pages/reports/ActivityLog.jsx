import Badge from "../../components/Badge";
import DataTable from "../../components/DataTable";
import { useAppData } from "../../data/AppDataProvider";
import { Page } from "../../components/PageShell";

export default function ActivityLog() {
  const { activityLogs, divisionName, loading, error } = useAppData();
  return (
    <Page title="Activity Log" subtitle="Riwayat aktivitas sistem internal WD Group.">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
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
