import React from "react";

type LogoProps = {
  /**
   * Logo icon (SVG, image, Lucide icon, ReactNode)
   */
  icon?: React.ReactNode;

  /**
   * Main brand text (optional)
   */
  title?: string;

  /**
   * Sub text (tagline) (optional)
   */
  subtitle?: string;

  /**
   * Whether to show text or only icon
   */
  showText?: boolean;

  /**
   * Size of the icon (applies only if the icon supports size)
   */
  size?: number;

  /**
   * Custom wrapper styles
   */
  className?: string;

  /**
   * Layout direction: "vertical" or "horizontal"
   */
  direction?: "vertical" | "horizontal";
};

export default function Logo({
  icon,
  title = "",
  subtitle = "",
  showText = true,
  size = 40,
  className = "",
  direction = "vertical",
}: LogoProps) {
  return (
    <div
      className={`flex items-center ${
        direction === "vertical" ? "flex-col" : "flex-row gap-2"
      } ${className}`}
    >
      {/* ICON */}
      <div className="flex items-center justify-center">
        {icon && (
          <span
            style={{ fontSize: size, width: size, height: size }}
            className="flex items-center justify-center"
          >
            {icon}
          </span>
        )}
      </div>

      {/* TEXT */}
      {showText && (title || subtitle) && (
        <div
          className={`flex ${
            direction === "vertical" ? "flex-col items-center mt-1" : "flex-col"
          }`}
        >
          {title && <span className="text-lg font-semibold">{title}</span>}
          {subtitle && (
            <span className="text-sm text-gray-500 leading-none">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
