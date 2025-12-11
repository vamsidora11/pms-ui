type BadgeProps = {
  label: string;
  type?: "success" | "warning" | "error" | "info";
};

export default function Badge({ label, type = "info" }: BadgeProps) {
  const colors: any = {
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type]}`}>
      {label}
    </span>
  );
}
