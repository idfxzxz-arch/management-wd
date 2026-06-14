import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import { minutes } from "../data/minutes";
import { getCurrentUser } from "../utils/auth";
import { contains, divisionName, scopedByDivision } from "../utils/helpers";
import { Page, Search } from "./Divisions";

export default function Minutes() {
  const user = getCurrentUser();
  const [query, setQuery] = useState("");
  const rows = useMemo(() => scopedByDivision(minutes, user).filter((item) => contains(Object.values(item).join(" "), query)), [query, user]);

  return (
    <Page title="Notulen Rapat" subtitle="Judul, tanggal, pemimpin, peserta, pembahasan, keputusan, dan tindak lanjut.">
      <Search value={query} setValue={setQuery} placeholder="Cari notulen rapat" />
      <DataTable
        rows={rows}
        columns={[
          { key: "title", header: "Judul Rapat", render: (row) => <Link className="font-semibold text-navy-700 hover:underline" to={`/minutes/${row.id}`}>{row.title}</Link> },
          { key: "date", header: "Tanggal" },
          { key: "time", header: "Waktu" },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "leader", header: "Pemimpin" },
          { key: "participants", header: "Peserta", render: (row) => row.participants.join(", ") },
          { key: "decision", header: "Keputusan", render: (row) => <span className="block max-w-md whitespace-normal">{row.decision}</span> },
          { key: "followUp", header: "Tindak Lanjut", render: (row) => <span className="block max-w-md whitespace-normal">{row.followUp}</span> },
        ]}
      />
    </Page>
  );
}
