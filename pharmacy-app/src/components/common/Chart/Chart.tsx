import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";

type ChartData = Record<string, string | number>;

type ChartProps = {
  data: ChartData[];
  xKey: string;
  yKey: string;
  type?: "line" | "bar";
  height?: number;
};

export default function Charts({
  data,
  xKey,
  yKey,
  type = "line",
  height = 300,
}: ChartProps) {
  return (
    <div className="w-full h-full border rounded-lg shadow-sm p-4 bg-white">
      <ResponsiveContainer width="100%" height={height}>
        {type === "line" ? (
          <LineChart data={data}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <CartesianGrid strokeDasharray="3 3" />
            <Line type="monotone" dataKey={yKey} stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar dataKey={yKey} fill="#16a34a" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}