import React from "react";

type Column<T> = {
  key: keyof T;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
};

export default function Table<T>({ columns, data }: TableProps<T>) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm">
      <table className="w-full border-collapse">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="text-left px-4 py-2 border-b font-medium"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-2 border-b">
                  {col.render
                    ? col.render(row[col.key], row)
                    : (row[col.key] as any)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
