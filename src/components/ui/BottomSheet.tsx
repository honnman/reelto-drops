"use client";
import { ReactNode, useEffect } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  title?: string;
}

export default function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto safe-area-inset-bottom">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          {title && <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>}
          {onClose && (
            <button
              onClick={onClose}
              className="ml-auto text-zinc-400 hover:text-zinc-600 p-1"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
