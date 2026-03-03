// src/components/common/Modal/Modal.tsx
import React from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  // If caller passes className, they own all sizing + padding (PackingListModal case)
  // If no className, use original defaults so nothing else in the app breaks
  const panelClass = className ?? "w-[400px] p-6";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-lg ${panelClass}`}>

        {/* Only show default title if using default layout (no custom className) */}
        {!className && title && (
          <h2 className="text-xl font-semibold mb-4">{title}</h2>
        )}

        {children}

        {/* Only show default Close button if using default layout */}
        {!className && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}