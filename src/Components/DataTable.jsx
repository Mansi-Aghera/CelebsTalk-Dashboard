export default function DataTable({ columns, data, actions }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr className="text-left">
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-3 font-medium">
                  {col.label}
                </th>
              ))}
              {actions && <th className="px-4 py-3 font-medium">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-t border-gray-100">

                {columns.map((col, i) => (
                  <td key={i} className="px-4 py-3 text-gray-700">

                    {/* if custom render exists */}
                    {col.render
                      ? col.render(row)
                      : col.type === "image" && row[col.key] ? (
                        <img
                          src={`https://adminapi.celebstalk.in/${row[col.key]}`}
                          alt=""
                          className="h-12 w-16 object-cover rounded-md"
                        />
                      ) : (
                        row[col.key] || "--"
                      )}
                  </td>
                ))}

                {actions && (
                  <td className="px-4 py-3 flex gap-2">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No results found
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}
