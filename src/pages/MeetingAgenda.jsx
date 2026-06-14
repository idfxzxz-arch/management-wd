import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import { getCurrentUser } from "../utils/auth";
import { useAppData } from "../data/AppDataProvider";
import { Page } from "./Divisions";

export default function MeetingAgenda() {
  const user = getCurrentUser();
  const { meetings, divisionName, scopedByDivision, loading, error } = useAppData();
  const rows = scopedByDivision(meetings, user);

  return (
    <Page title="Agenda Rapat" subtitle="Jadwal rapat mendatang, divisi, topik, peserta, dan status rapat.">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data Supabase...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      <DataTable
        rows={rows}
        columns={[
          { key: "date", header: "Tanggal" },
          { key: "time", header: "Jam" },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "topic", header: "Topik" },
          { key: "participants", header: "Peserta", render: (row) => row.participants.join(", ") },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
        ]}
      />
    </Page>
  );
}
