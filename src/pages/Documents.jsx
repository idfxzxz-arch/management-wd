import { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { getCurrentUser } from "../utils/auth";
import { contains } from "../utils/helpers";
import { Page, Search } from "./Divisions";
import { useAppData } from "../data/AppDataProvider";

export default function Documents() {
  const user = getCurrentUser();
  const { documents, divisionName, scopedByDivision, loading, error } = useAppData();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const rows = useMemo(() => scopedByDivision(documents, user).filter((doc) => contains(Object.values(doc).join(" "), query)), [query, user]);

  return (
    <Page title="Arsip Dokumen" subtitle="Daftar dokumen , kategori, divisi, tanggal upload, dan tipe file.">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
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
      <Modal open={Boolean(selected)} title="Detail Dokumen" onClose={() => setSelected(null)}>
        {selected && <div className="space-y-2 text-sm text-slate-700"><p><b>Nama:</b> {selected.name}</p><p><b>Kategori:</b> {selected.category}</p><p><b>Divisi:</b> {divisionName(selected.divisionId)}</p><p><b>Tipe:</b> {selected.type}</p></div>}
      </Modal>
    </Page>
  );
}
