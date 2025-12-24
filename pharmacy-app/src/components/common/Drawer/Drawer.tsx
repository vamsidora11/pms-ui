import React from "react";

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export default function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        ></div>
      )}

      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg p-6 z-50 transform transition-transform
        ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
        {children}
      </div>
    </>
  );
}
