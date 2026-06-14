import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import { meetings } from "../data/meetings";
import { getCurrentUser } from "../utils/auth";
import { divisionName, scopedByDivision } from "../utils/helpers";
import { Page } from "./Divisions";

export default function MeetingAgenda() {
  const user = getCurrentUser();
  const rows = scopedByDivision(meetings, user);

  return (
    <Page title="Agenda Rapat" subtitle="Jadwal rapat mendatang, divisi, topik, peserta, dan status rapat.">
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
