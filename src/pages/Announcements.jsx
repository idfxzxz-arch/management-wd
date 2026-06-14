import { useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { announcements } from "../data/announcements";
import { getCurrentUser } from "../utils/auth";
import { Page } from "./Divisions";

export default function Announcements() {
  const user = getCurrentUser();
  const [open, setOpen] = useState(false);

  return (
    <Page title="Pengumuman Internal" subtitle="Daftar pengumuman perusahaan, target divisi, dan prioritas." action={user.role === "Owner" && <button onClick={() => setOpen(true)} className="rounded bg-navy-800 px-4 py-2 text-sm font-semibold text-white">Buat Pengumuman</button>}>
      <DataTable
        rows={announcements}
        columns={[
          { key: "title", header: "Judul" },
          { key: "content", header: "Isi", render: (row) => <span className="block max-w-lg whitespace-normal">{row.content}</span> },
          { key: "author", header: "Dibuat Oleh" },
          { key: "date", header: "Tanggal" },
          { key: "target", header: "Target Divisi" },
          { key: "priority", header: "Prioritas", render: (row) => <Badge>{row.priority}</Badge> },
        ]}
      />
      <Modal open={open} title="Form Pengumuman Dummy" onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <input className="rounded border border-slate-200 px-3 py-2" placeholder="Judul pengumuman" />
          <textarea className="rounded border border-slate-200 px-3 py-2" placeholder="Isi pengumuman" />
          <select className="rounded border border-slate-200 px-3 py-2"><option>Semua Divisi</option><option>IT</option><option>Marketing</option></select>
          <button className="rounded bg-navy-800 px-4 py-2 font-semibold text-white">Publikasikan Dummy</button>
        </div>
      </Modal>
    </Page>
  );
}
