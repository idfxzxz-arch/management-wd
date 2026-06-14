import { useMemo, useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import { employees } from "../data/employees";
import { getCurrentUser } from "../utils/auth";
import { contains, divisionName, scopedByDivision } from "../utils/helpers";
import { Page, Search } from "./Divisions";

export default function Employees() {
  const user = getCurrentUser();
  const [query, setQuery] = useState("");
  const rows = useMemo(() => scopedByDivision(employees, user).filter((employee) => contains(Object.values(employee).join(" "), query)), [query, user]);

  return (
    <Page title="Halaman Karyawan" subtitle="Data karyawan, jabatan, divisi, role, status, dan tanggal bergabung.">
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
