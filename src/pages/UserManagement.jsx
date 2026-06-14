import { useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { users } from "../data/users";
import { divisionName } from "../utils/helpers";
import { Page } from "./Divisions";

export default function UserManagement() {
  const [selected, setSelected] = useState(null);
  return (
    <Page title="User Management" subtitle="Khusus Owner untuk melihat user, role, divisi, status, dan aksi dummy.">
      <DataTable
        rows={users}
        columns={[
          { key: "name", header: "Nama" },
          { key: "email", header: "Email" },
          { key: "role", header: "Role", render: (row) => <Badge>{row.role}</Badge> },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
          { key: "actions", header: "Aksi", render: (row) => <div className="flex gap-2"><button onClick={() => setSelected(row)} className="rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold">Edit</button><button className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">Nonaktifkan</button></div> },
        ]}
      />
      <Modal open={Boolean(selected)} title="Edit User Dummy" onClose={() => setSelected(null)}>
        {selected && <div className="grid gap-3"><input className="rounded border border-slate-200 px-3 py-2" defaultValue={selected.name} /><input className="rounded border border-slate-200 px-3 py-2" defaultValue={selected.email} /><button className="rounded bg-navy-800 px-4 py-2 font-semibold text-white">Simpan Dummy</button></div>}
      </Modal>
    </Page>
  );
}
