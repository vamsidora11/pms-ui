import { ChevronRight, Home } from "lucide-react";
import type { ReactNode } from "react";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      <Home className="w-4 h-4 text-gray-400" />

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-gray-400" />

          <button
            onClick={item.onClick}
            className="flex items-center gap-1.5 text-gray-700 font-medium hover:text-blue-600"
          >
            {item.icon}
            {item.label}
          </button>
        </div>
      ))}
    </nav>
  );
}
