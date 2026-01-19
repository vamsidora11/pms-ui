// import React from "react";

// type InputProps = {
//   label?: string;
//   placeholder?: string;
//   value: string;
//   onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   type?: string;
//   required?: boolean;
//   error?: string;
//   disabled?: boolean;
//   leftIcon?: React.ReactNode;
//   rightIcon?: React.ReactNode;
//   className?: string;
// };

// export default function Input({
//   label,
//   placeholder,
//   value,
//   onChange,
//   type = "text",
//   required = false,
//   error,
//   disabled = false,
//   leftIcon,
//   rightIcon,
//   className = "",
// }: InputProps) {
//   return (
//     <div className="flex flex-col gap-1">
//       {/* Label */}
//       {label && (
//         <label className="text-sm font-medium text-gray-900">
//           {label}
//           {required && <span className="text-red-500"> *</span>}
//         </label>
//       )}

//       {/* Input Wrapper */}
//       <div
//         className={`
//           flex items-center gap-3
//           h-11 px-4
//           rounded-lg
//           transition-all duration-200
//           shadow-inner

//           ${disabled
//             ? "bg-gray-100 cursor-not-allowed opacity-70"
//             : `
//               bg-gray-200
//               hover:bg-gray-300
//               focus-within:bg-gray-400
//             `}

//           ${error ? "ring-1 ring-red-500 bg-red-50" : ""}
//           ${className}
//         `}
//       >
//         {/* Left Icon */}
//         {leftIcon && (
//           <span className="text-gray-400">
//             {leftIcon}
//           </span>
//         )}

//         {/* Input */}
//         <input
//           type={type}
//           value={value}
//           onChange={onChange}
//           placeholder={placeholder}
//           disabled={disabled}
//           required={required}
//           className="
//             w-full
//             bg-transparent
//             text-sm
//             text-gray-900
//             placeholder:text-gray-500
//             outline-none
//           "
//         />

//         {/* Right Icon */}
//         {rightIcon && (
//           <span className="text-gray-400">
//             {rightIcon}
//           </span>
//         )}
//       </div>

//       {/* Error */}
//       {error && (
//         <p className="text-xs text-red-500 mt-1">
//           {error}
//         </p>
//       )}
//     </div>
//   );
// }

import React from "react";
import clsx from "clsx";

type InputProps = {
  label?: string;
  placeholder?: string;
  value: string;
  // expose value directly for convenience
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
};

export default function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
  error,
  disabled = false,
  leftIcon,
  rightIcon,
  className = "",
}: InputProps) {
  const inputId = React.useId();

  return (
    <div className="flex flex-col gap-1">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-900 mb-1 block"
        >
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      {/* Input Wrapper */}
      <div
        className={clsx(
          "flex items-center gap-3 h-11 px-4 rounded-lg transition-all duration-200 shadow-inner",
          disabled
            ? "bg-gray-100 cursor-not-allowed opacity-70"
            : "bg-gray-50 border border-gray-200 hover:bg-gray-200 focus-within:bg-gray-200 focus-within:ring-2 focus-within:ring-blue-500",
          error && "ring-1 ring-red-500 bg-red-50",
          className,
        )}
      >
        {leftIcon && <span className="text-gray-400">{leftIcon}</span>}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-500 outline-none"
        />

        {rightIcon && <span className="text-gray-400">{rightIcon}</span>}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
