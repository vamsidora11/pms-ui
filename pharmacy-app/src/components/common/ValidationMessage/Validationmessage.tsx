
import { AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react";

type ValidationMessageProps = {
  message?: string;
  type?: "error" | "warning" | "success" | "info";
};

export default function ValidationMessage({
  message = "",
  type = "error",
}: ValidationMessageProps) {
  if (!message) return null;

  const styles = {
    error: "text-red-600",
    warning: "text-yellow-600",
    success: "text-green-600",
    info: "text-blue-600",
  };

  const icons = {
    error: <AlertCircle size={16} />,
    warning: <AlertTriangle size={16} />,
    success: <CheckCircle size={16} />,
    info: <Info size={16} />,
  };

  return (
    <div className={`flex items-center gap-1 text-sm mt-1 ${styles[type]}`}>
      {icons[type]}
      <span>{message}</span>
    </div>
  );
}
