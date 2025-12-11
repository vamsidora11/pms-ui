type ButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger";
  onClick?: () => void;
  disabled?: boolean;
};

export default function Button({
  children,
  type = "button",
  variant = "primary",
  onClick,
  disabled = false,
}: ButtonProps) {
  const base = "px-4 py-2 rounded-lg font-medium w-full";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-300 text-gray-800 hover:bg-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}
