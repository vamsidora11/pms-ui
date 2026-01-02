import { FiAlertCircle, FiCheckCircle, FiClock, FiPackage } from "react-icons/fi";

interface IconProps {
  name: "alert" | "check" | "clock" | "package";
  size?: number;
  color?: string;
}

const Icon = ({ name, size = 20, color = "text-gray-600" }: IconProps) => {
  switch (name) {
    case "alert":
      return <FiAlertCircle className={color} size={size} />;
    case "check":
      return <FiCheckCircle className={color} size={size} />;
    case "clock":
      return <FiClock className={color} size={size} />;
    case "package":
      return <FiPackage className={color} size={size} />;
    default:
      return <span className={color}>?</span>;
  }
};

export default Icon;