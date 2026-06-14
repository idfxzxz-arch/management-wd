import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import { getCurrentUser } from "../utils/auth";
import { useAppData } from "../data/AppDataProvider";
import { Page } from "./Divisions";

export default function SOP() {
  const { sops, divisionName, scopedByDivision, loading, error } = useAppData();
  const rows = scopedByDivision(sops, getCurrentUser());
  return (
    <Page title="SOP Perusahaan" subtitle="Daftar SOP, divisi terkait, deskripsi, tanggal update, dan status aktif.">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      <DataTable
        rows={rows}
        columns={[
          { key: "title", header: "Judul SOP" },
          { key: "divisionId", header: "Divisi Terkait", render: (row) => divisionName(row.divisionId) },
          { key: "description", header: "Deskripsi", render: (row) => <span className="block max-w-lg whitespace-normal">{row.description}</span> },
          { key: "updatedAt", header: "Tanggal Update" },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
        ]}
      />
    </Page>
  );
}
