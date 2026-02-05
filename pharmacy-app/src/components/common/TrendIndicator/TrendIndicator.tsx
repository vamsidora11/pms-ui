import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  value: number;
  inverse?: boolean;
  className?: string;
}

export default function TrendIndicator({
  value,
  inverse = false,
  className = "",
}: Props) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  const good = inverse ? isNegative : isPositive;

  const color = good
    ? "text-green-600 bg-green-50"
    : value === 0
    ? "text-gray-600 bg-gray-50"
    : "text-red-600 bg-red-50";

  const Icon =
    value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${color} ${className}`}
    >
      <Icon className="w-3 h-3" />
      <span className="text-xs font-semibold">
        {value > 0 && "+"}
        {value}%
      </span>
    </div>
  );
}
