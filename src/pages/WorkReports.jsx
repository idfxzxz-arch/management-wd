import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { useState } from "react";
import { reports } from "../data/reports";
import { getCurrentUser } from "../utils/auth";
import { divisionName, scopedByDivision } from "../utils/helpers";
import { Page } from "./Divisions";

export default function WorkReports() {
  const user = getCurrentUser();
  const [open, setOpen] = useState(false);
  const rows = user.role === "Staff" && user.divisionId !== "all" ? reports.filter((report) => report.staff === user.name) : scopedByDivision(reports, user);

  return (
    <Page title="Laporan Kerja" subtitle="Laporan harian/mingguan dummy, kendala, rencana berikutnya, dan status." action={<button onClick={() => setOpen(true)} className="rounded bg-navy-800 px-4 py-2 text-sm font-semibold text-white">Kirim Laporan</button>}>
      <DataTable
        rows={rows}
        columns={[
          { key: "staff", header: "Nama Staff" },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "done", header: "Sudah Dilakukan", render: (row) => <span className="block max-w-md whitespace-normal">{row.done}</span> },
          { key: "blockers", header: "Kendala", render: (row) => <span className="block max-w-md whitespace-normal">{row.blockers}</span> },
          { key: "next", header: "Rencana Berikutnya", render: (row) => <span className="block max-w-md whitespace-normal">{row.next}</span> },
          { key: "date", header: "Tanggal" },
          { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
        ]}
      />
      <Modal open={open} title="Form Laporan Kerja Dummy" onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <textarea className="rounded border border-slate-200 px-3 py-2" placeholder="Pekerjaan yang sudah dilakukan" />
          <textarea className="rounded border border-slate-200 px-3 py-2" placeholder="Kendala" />
          <textarea className="rounded border border-slate-200 px-3 py-2" placeholder="Rencana berikutnya" />
          <button className="rounded bg-navy-800 px-4 py-2 font-semibold text-white">Kirim Dummy</button>
        </div>
      </Modal>
    </Page>
  );
}
