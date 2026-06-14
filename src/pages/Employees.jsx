import { useMemo, useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import { getCurrentUser } from "../utils/auth";
import { contains } from "../utils/helpers";
import { Page, Search } from "./Divisions";
import { useAppData } from "../data/AppDataProvider";

export default function Employees() {
  const user = getCurrentUser();
  const { employees, divisionName, scopedByDivision, loading, error } = useAppData();
  const [query, setQuery] = useState("");
  const rows = useMemo(() => scopedByDivision(employees, user).filter((employee) => contains(Object.values(employee).join(" "), query)), [query, user]);

  return (
    <Page title="Halaman Karyawan" subtitle="Data karyawan, jabatan, divisi, role, status, dan tanggal bergabung.">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      <Search value={query} setValue={setQuery} placeholder="Cari nama, email, jabatan, atau divisi" />
      <DataTable
        rows={rows}
        columns={[
          { key: "name", header: "Nama" },
          { key: "email", header: "Email" },
          { key: "position", header: "Jabatan" },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "role", header: "Role", render: (row) => <Badge>{row.role}</Badge> },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
          { key: "joinedAt", header: "Bergabung" },
        ]}
      />
    </Page>
  );
}
