import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import { divisions } from "../data/divisions";
import { tasks } from "../data/tasks";
import { contains } from "../utils/helpers";

export default function Divisions() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => divisions.filter((division) => contains(division.name + division.head + division.description, query)), [query]);

  return (
    <Page title="Halaman Divisi" subtitle="Daftar divisi, kepala divisi, anggota, total tugas, dan status performa.">
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

export function Page({ title, subtitle, children, action }) {
  return (
    <div className="space-y-5">
      <div className="surface-panel flex flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="section-title text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Search({ value, setValue, placeholder = "Cari data" }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/60 focus-within:border-navy-700 focus-within:ring-2 focus-within:ring-blue-100 lg:max-w-xl">
      <SearchIcon size={18} className="shrink-0 text-slate-400" />
      <input className="w-full text-sm outline-none" value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} />
    </div>
  );
}
