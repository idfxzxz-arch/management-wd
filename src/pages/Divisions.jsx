import { useMemo, useState } from "react";
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
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Search({ value, setValue, placeholder = "Cari data" }) {
  return <input className="w-full rounded border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-navy-700" value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} />;
}
