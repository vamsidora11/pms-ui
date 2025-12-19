import React from "react";
import { FiAlertCircle, FiCheckCircle, FiClock, FiPackage } from "react-icons/fi"; 
// You can import more icons from react-icons or your own SVGs

interface IconProps {
  name: "alert" | "check" | "clock" | "package"; // extend with more names
  size?: number;   // default size
  color?: string;  // Tailwind color class, e.g. "text-red-500"
}

const Icon: React.FC<IconProps> = ({ name, size = 20, color = "text-gray-600" }) => {
  const icons: Record<string, JSX.Element> = {
    alert: <FiAlertCircle className={`${color}`} size={size} />,
    check: <FiCheckCircle className={`${color}`} size={size} />,
    clock: <FiClock className={`${color}`} size={size} />,
    package: <FiPackage className={`${color}`} size={size} />,
  };

  return icons[name] || <span className={`${color}`}>?</span>;
};

export default Icon;
