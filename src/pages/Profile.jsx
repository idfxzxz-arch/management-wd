import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import { getCurrentUser } from "../utils/auth";
import { useAppData } from "../data/AppDataProvider";
import { Page } from "./Divisions";

export default function Profile() {
  const user = getCurrentUser();
  const { tasks, divisionName, employeeName, loading, error } = useAppData();
  const myTasks = user.role === "Owner" || user.divisionId === "all" ? tasks.slice(0, 8) : tasks.filter((task) => task.assigneeId === user.id || task.divisionId === user.divisionId);
  return (
    <Page title="Profile" subtitle="Informasi user login dan riwayat tugas singkat.">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data Supabase...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Nama" value={user.name} />
          <Info label="Email" value={user.email} />
          <Info label="Role" value={<Badge>{user.role}</Badge>} />
          <Info label="Divisi" value={divisionName(user.divisionId)} />
        </div>
      </section>
      <DataTable
        rows={myTasks}
        columns={[
          { key: "title", header: "Riwayat Tugas" },
          { key: "assigneeId", header: "PIC", render: (row) => employeeName(row.assigneeId) },
          { key: "deadline", header: "Deadline" },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
        ]}
      />
    </Page>
  );
}

function Info({ label, value }) {
  return <div className="rounded bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><div className="mt-1 text-sm font-semibold text-slate-800">{value}</div></div>;
}
