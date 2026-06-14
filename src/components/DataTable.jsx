export default function DataTable({ columns, rows, empty = "Data tidak ditemukan" }) {
  return (
    <div className="table-scroll overflow-x-auto rounded border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && (
            <tr>
              <td className="px-4 py-8 text-center text-slate-500" colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          )}
          {rows.map((row, index) => (
            <tr key={row.id || index} className="hover:bg-slate-50">
              {columns.map((column) => (
                <td key={column.key} className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
