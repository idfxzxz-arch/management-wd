function joinClass(...classes) {
  return classes.filter(Boolean).join(" ");
}

const wrapKeys = ["description", "content", "discussion", "decision", "followUp", "done", "blockers", "next", "note", "action"];

export default function DataTable({ columns, rows, empty = "Data tidak ditemukan" }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-sm shadow-slate-200/60">
      <div className="grid gap-3 p-2.5 sm:p-3 md:hidden">
        {rows.length === 0 && <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">{empty}</div>}
        {rows.map((row, index) => (
          <article key={row.id || index} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="space-y-2.5">
              {columns.map((column) => {
                const value = column.render ? column.render(row) : row[column.key];

                return (
                  <div key={column.key} className="rounded-lg bg-slate-50/80 p-3 text-sm sm:grid sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-3 sm:bg-transparent sm:p-0">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 sm:mb-0 sm:text-xs">{column.header}</p>
                    <div className="min-w-0 break-words text-slate-700">{value}</div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
      <div className="table-scroll hidden overflow-x-auto md:block">
        <table className="min-w-[980px] border-separate border-spacing-0 text-sm xl:min-w-full">
          <thead className="bg-slate-50/95 shadow-[inset_0_-1px_0_#e2e8f0]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ width: column.width }}
                  className={joinClass(
                    "whitespace-nowrap px-4 py-3.5 text-left text-xs font-bold uppercase text-slate-500",
                    "first:pl-5 last:pr-5",
                    column.headerClassName
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="px-4 py-10 text-center text-slate-500" colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          )}
          {rows.map((row, index) => (
            <tr key={row.id || index} className="border-b border-slate-100 odd:bg-white even:bg-slate-50/45 hover:bg-blue-50/50">
              {columns.map((column) => {
                const shouldWrap = column.wrap || wrapKeys.includes(column.key);

                return (
                  <td
                    key={column.key}
                    className={joinClass(
                      "border-b border-slate-100 px-4 py-3.5 align-top text-slate-700 first:pl-5 last:pr-5",
                      shouldWrap ? "min-w-[190px] whitespace-normal leading-6" : "whitespace-nowrap",
                      column.cellClassName
                    )}
                  >
                    <div className={joinClass(shouldWrap && "max-w-md", column.contentClassName)}>
                      {column.render ? column.render(row) : row[column.key]}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <div className="flex flex-col gap-1 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>{rows.length} data ditampilkan</span>
        <span>WD Group Internal Management</span>
      </div>
    </div>
  );
}
