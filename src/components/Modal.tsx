import React, { useEffect, useRef } from "react";
import { haptic } from "../lib/haptics";
import { X } from "lucide-react";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showClose?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showClose = true,
  className = "",
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        haptic.light();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-[#F9F7F5] flex flex-col animate-[fadeIn_0.2s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Header */}
      {(title || showClose) && (
        <div className="p-4 bg-white border-b border-[#E6E0D8] flex items-center justify-between shrink-0">
          {title && (
            <span className="text-sm font-bold text-[#2D241E] font-serif">
              {title}
            </span>
          )}
          {showClose && (
            <button
              type="button"
              onClick={() => { haptic.light(); onClose(); }}
              className="p-2 rounded-xl text-[#8C7E6E] hover:text-[#2D241E] hover:bg-[#E6E0D8] cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${className}`}>
        {children}
      </div>
    </div>
  );
};
