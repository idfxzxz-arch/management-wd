import { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { documents } from "../data/documents";
import { getCurrentUser } from "../utils/auth";
import { contains, divisionName, scopedByDivision } from "../utils/helpers";
import { Page, Search } from "./Divisions";

export default function Documents() {
  const user = getCurrentUser();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const rows = useMemo(() => scopedByDivision(documents, user).filter((doc) => contains(Object.values(doc).join(" "), query)), [query, user]);

  return (
    <Page title="Arsip Dokumen" subtitle="Daftar dokumen dummy, kategori, divisi, tanggal upload, dan tipe file.">
      <Search value={query} setValue={setQuery} placeholder="Cari dokumen, kategori, atau tipe file" />
      <DataTable
        rows={rows}
        columns={[
          { key: "name", header: "Nama Dokumen" },
          { key: "category", header: "Kategori" },
          { key: "divisionId", header: "Divisi", render: (row) => divisionName(row.divisionId) },
          { key: "uploadedAt", header: "Tanggal Upload" },
          { key: "type", header: "Tipe File" },
          { key: "detail", header: "Detail", render: (row) => <button onClick={() => setSelected(row)} className="rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Lihat Detail</button> },
        ]}
      />
      <Modal open={Boolean(selected)} title="Detail Dokumen Dummy" onClose={() => setSelected(null)}>
        {selected && <div className="space-y-2 text-sm text-slate-700"><p><b>Nama:</b> {selected.name}</p><p><b>Kategori:</b> {selected.category}</p><p><b>Divisi:</b> {divisionName(selected.divisionId)}</p><p><b>Tipe:</b> {selected.type}</p></div>}
      </Modal>
    </Page>
  );
}
