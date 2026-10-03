export function Table({
  columns,
  rows,
  renderRow,
  empty = "Ma'lumot topilmadi",
}) {
  return (
    <div
      className="table-scroll"
      role="region"
      aria-label="Ma’lumotlar jadvali"
      tabIndex={0}
    >
      <p className="table-mobile-hint">
        Barcha ustunlar uchun jadvalni yon tomonga suring.
      </p>
      <table className="workspace-table">
        <thead>
          <tr>
            {columns.map((column, i) => (
              <th key={i} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map(renderRow)
          ) : (
            <tr>
              <td colSpan={columns.length} className="empty-cell">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
