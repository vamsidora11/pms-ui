type TabsProps = {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
};

export default function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-6 border-b pb-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`pb-1 text-sm font-medium 
            ${active === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
