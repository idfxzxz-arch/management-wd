import { useMemo, useState } from "react";
import Badge from "../../components/Badge";
import DataTable from "../../components/DataTable";
import { getCurrentUser } from "../../utils/auth";
import { contains } from "../../utils/helpers";
import { Page, Search } from "../../components/PageShell";
import { useAppData } from "../../data/AppDataProvider";

export default function Employees() {
  const user = getCurrentUser();
  const { users, employees, divisionName, scopedByDivision, loading, error } = useAppData();
  const [query, setQuery] = useState("");
  const currentProfile = users.find((item) => item.email?.toLowerCase() === user?.email?.toLowerCase());
  const effectiveUser = currentProfile ? { ...user, role: currentProfile.role, divisionId: currentProfile.divisionId } : user;
  const rows = useMemo(
    () => scopedByDivision(employees, effectiveUser)
      .filter((employee) => employee.role !== "Magang")
      .filter((employee) => contains(Object.values(employee).join(" "), query)),
    [employees, effectiveUser?.role, effectiveUser?.divisionId, query],
  );

  return (
    <Page title="Halaman Staf" subtitle="Data staf, jabatan, divisi, role, status, dan tanggal bergabung.">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      <Search value={query} setValue={setQuery} placeholder="Cari nama, email, jabatan, atau divisi" />
      <DataTable
        rows={rows}
        columns={[
          { key: "name", header: "Nama" },
          { key: "email", header: "Email" },
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
