export function Table({ columns, rows, renderRow, empty = "Ma'lumot topilmadi" }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-separate border-spacing-y-3 text-left text-sm">
        <thead className="text-[13px] font-medium text-[#7d8291]">
          <tr>{columns.map((column) => <th className="px-4 pb-1 font-medium" key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map(renderRow) : (
            <tr>
              <td className="rounded-[5px] bg-white px-4 py-8 text-center text-[#6b7280] shadow-sm dark:bg-[#20262d] dark:text-[#a9b1bf]" colSpan={columns.length}>{empty}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function LegacyTable({ columns, rows, renderRow, empty = "Ma'lumot topilmadi" }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e6e9f0] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-[#fbfcff] text-xs uppercase tracking-wide text-[#6b7280]">
            <tr>{columns.map((column) => <th className="px-4 py-3" key={column}>{column}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[#eef1f7]">
            {rows.length ? rows.map(renderRow) : (
              <tr>
                <td className="px-4 py-8 text-center text-[#6b7280]" colSpan={columns.length}>{empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
