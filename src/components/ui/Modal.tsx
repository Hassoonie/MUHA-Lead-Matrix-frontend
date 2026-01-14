"use client";

import { useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            "bg-white dark:bg-[#0a0a0a] rounded-[10px] shadow-xl dark:shadow-[#c5b26f]/10 w-full max-w-4xl max-h-[90vh] flex flex-col animate-pop-in border border-gray-200 dark:border-gray-800",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center ${title ? 'justify-between' : 'justify-end'} p-6 border-b border-[#f0f5fa] dark:border-gray-800`}>
            {title && (
              <h2 className="text-xl font-semibold text-black dark:text-[#c5b26f]">{title}</h2>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#f0f5fa] dark:hover:bg-[#1a1a1a] rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6 text-black dark:text-[#c5b26f]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </>
  );
}
