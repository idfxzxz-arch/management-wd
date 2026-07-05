import { Search as SearchIcon } from "lucide-react";

export function Page({ title, subtitle, children, action }) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="surface-panel flex flex-col justify-between gap-4 px-4 py-4 sm:flex-row sm:items-end sm:px-5 sm:py-5">
        <div className="min-w-0">
          <h1 className="section-title text-lg font-bold leading-tight text-slate-900 sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p>}
        </div>
        {action && <div className="w-full shrink-0 [&>a]:flex [&>a]:w-full [&>a]:justify-center [&>button]:w-full sm:w-auto sm:[&>a]:inline-flex sm:[&>a]:w-auto sm:[&>button]:w-auto">{action}</div>}
      </div>
      {children}
    </div>
  );
}

export function Search({ value, setValue, placeholder = "Cari data" }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm shadow-slate-200/60 focus-within:border-navy-700 focus-within:ring-2 focus-within:ring-blue-100 sm:px-4 sm:py-3">
      <SearchIcon size={18} className="shrink-0 text-slate-400" />
      <input className="w-full text-sm outline-none" value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} />
    </div>
  );
}
