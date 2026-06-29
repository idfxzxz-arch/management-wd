import { useMemo, useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import { contains } from "../utils/helpers";
import { Page, Search } from "./Divisions";
import { useAppData } from "../data/AppDataProvider";

export default function Interns() {
  const { employees, divisionName, loading, error } = useAppData();
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () => employees
      .filter((employee) => employee.role === "Magang")
      .filter((employee) => contains(Object.values(employee).join(" "), query)),
    [employees, query],
  );

  return (
    <Page title="Halaman Staf Magang" subtitle="Data staf magang, email login, divisi, status, dan tanggal bergabung.">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      <Search value={query} setValue={setQuery} placeholder="Cari nama, email, jabatan, atau divisi magang" />
      <DataTable
        rows={rows}
        columns={[
          { key: "name", header: "Nama" },
          { key: "email", header: "Email Login" },
          { key: "position", header: "Jabatan" },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId, row.role) },
          { key: "role", header: "Role", render: (row) => <Badge>{row.role}</Badge> },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
          { key: "joinedAt", header: "Bergabung" },
        ]}
      />
    </Page>
  );
}
