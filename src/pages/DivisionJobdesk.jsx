import { useMemo, useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { tasks } from "../data/tasks";
import { getCurrentUser } from "../utils/auth";
import { contains, divisionName, scopedByDivision } from "../utils/helpers";
import { Page, Search } from "./Divisions";

export default function DivisionJobdesk() {
  const user = getCurrentUser();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rows = useMemo(() => scopedByDivision(tasks, user).filter((task) => contains(task.title + task.target + task.status + task.assignedByName, query)), [query, user]);

  return (
    <Page
      title="Jobdesk Per Divisi"
      subtitle="Daftar jobdesk berdasarkan divisi, pemberi tugas, target kerja, prioritas, deadline, dan status."
      action={<button onClick={() => setOpen(true)} className="rounded bg-navy-800 px-4 py-2 text-sm font-semibold text-white">Tambah Dummy</button>}
    >
      <Search value={query} setValue={setQuery} placeholder="Cari jobdesk divisi" />
      <DataTable
        rows={rows}
        columns={[
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "assignedBy", header: "Dari", render: (row) => <Badge>{row.assignedBy}</Badge> },
          { key: "assignedByName", header: "Pemberi Tugas" },
          { key: "title", header: "Tugas Utama" },
          { key: "target", header: "Target Kerja" },
          { key: "priority", header: "Prioritas", render: (row) => <Badge>{row.priority}</Badge> },
          { key: "deadline", header: "Deadline" },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
        ]}
      />
      <Modal open={open} title="Form Tambah Jobdesk Dummy" onClose={() => setOpen(false)}>
        <DummyForm />
      </Modal>
    </Page>
  );
}

function DummyForm() {
  return (
    <div className="grid gap-3">
      <input className="rounded border border-slate-200 px-3 py-2" placeholder="Judul tugas" />
      <textarea className="rounded border border-slate-200 px-3 py-2" placeholder="Deskripsi singkat" />
      <select className="rounded border border-slate-200 px-3 py-2"><option>Dari Owner</option><option>Dari Kepala Divisi</option></select>
      <select className="rounded border border-slate-200 px-3 py-2"><option>Prioritas Tinggi</option><option>Sedang</option><option>Rendah</option></select>
      <button className="rounded bg-navy-800 px-4 py-2 font-semibold text-white">Simpan Dummy</button>
    </div>
  );
}
