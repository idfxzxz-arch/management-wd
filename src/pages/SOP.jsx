import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import { sops } from "../data/sops";
import { getCurrentUser } from "../utils/auth";
import { divisionName, scopedByDivision } from "../utils/helpers";
import { Page } from "./Divisions";

export default function SOP() {
  const rows = scopedByDivision(sops, getCurrentUser());
  return (
    <Page title="SOP Perusahaan" subtitle="Daftar SOP, divisi terkait, deskripsi, tanggal update, dan status aktif.">
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
