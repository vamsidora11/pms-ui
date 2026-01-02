type FilterBarProps = {
  onSearch: (value: string) => void;
  rightContent?: React.ReactNode;
};

export default function FilterBar({ onSearch, rightContent }: FilterBarProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow mb-4">
      <input
        type="text"
        placeholder="Search..."
        onChange={(e) => onSearch(e.target.value)}
        className="border px-3 py-2 rounded w-64"
      />
      <div>{rightContent}</div>
    </div>
  );
}
