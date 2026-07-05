import { useMemo, useState } from "react";
import Badge from "../../components/Badge";
import DataTable from "../../components/DataTable";
import { Page, Search } from "../../components/PageShell";
import { contains } from "../../utils/helpers";
import { useAppData } from "../../data/AppDataProvider";

export default function Divisions() {
  const { divisions, tasks, loading, error } = useAppData();
  const [query, setQuery] = useState("");
  const rows = useMemo(() => divisions.filter((division) => contains(division.name + division.head + division.description, query)), [query]);

  return (
    <Page title="Halaman Divisi" subtitle="Daftar divisi, kepala divisi, anggota, total tugas, dan status performa.">
      {loading && <div className="surface-panel p-4 text-sm text-slate-500">Memuat data...</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}
      <Search value={query} setValue={setQuery} placeholder="Cari divisi atau kepala divisi" />
      <DataTable
        rows={rows}
        columns={[
          { key: "name", header: "Nama Divisi" },
          { key: "head", header: "Kepala Divisi" },
          { key: "members", header: "Anggota" },
          { key: "description", header: "Deskripsi", render: (row) => <span className="block max-w-xl whitespace-normal">{row.description}</span> },
          { key: "tasks", header: "Total Tugas", render: (row) => tasks.filter((task) => task.divisionId === row.id).length },
          { key: "performance", header: "Performa", render: (row) => <Badge>{row.performance}</Badge> },
        ]}
      />
    </Page>
  );
}
