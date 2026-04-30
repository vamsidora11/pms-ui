export function TableSkeleton({
  rows = 5,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {[...Array(columns)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded" />
        ))}
      </div>

      {/* Rows */}
      {[...Array(rows)].map((_, r) => (
        <div
          key={r}
          className="p-4 grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {[...Array(columns)].map((_, c) => (
            <div key={c} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}
