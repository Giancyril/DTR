import { useEffect } from "react";
import { FaExclamationTriangle, FaTimes, FaTrash, FaCheck } from "react-icons/fa";

interface ConfirmDialogProps {
  isOpen:      boolean;
  title:       string;
  message:     string;
  confirmText?: string;
  cancelText?:  string;
  variant?:     "danger" | "warning" | "info";
  onConfirm:   () => void;
  onCancel:    () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText  = "Cancel",
  variant     = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const variantMap = {
    danger:  {
      icon:    <FaTrash size={18} className="text-red-400" />,
      iconBg:  "bg-red-500/10 border-red-500/20",
      confirm: "bg-red-600 hover:bg-red-500 shadow-red-900/30",
    },
    warning: {
      icon:    <FaExclamationTriangle size={18} className="text-amber-400" />,
      iconBg:  "bg-amber-500/10 border-amber-500/20",
      confirm: "bg-amber-600 hover:bg-amber-500 shadow-amber-900/30",
    },
    info: {
      icon:    <FaCheck size={18} className="text-blue-400" />,
      iconBg:  "bg-blue-500/10 border-blue-500/20",
      confirm: "bg-blue-600 hover:bg-blue-500 shadow-blue-900/30",
    },
  };

  const v = variantMap[variant];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[999] p-4"
      onClick={onCancel}>
      <div
        className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${v.iconBg}`}>
              {v.icon}
            </div>
            <h3 className="text-white font-bold text-sm">{title}</h3>
          </div>
          <button onClick={onCancel}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0 ml-2">
            <FaTimes size={11} />
          </button>
        </div>

        {/* Message */}
        <p className="text-gray-400 text-sm px-5 pb-5 leading-relaxed">{message}</p>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/5 text-gray-400 hover:text-white text-xs font-semibold rounded-xl transition-all">
            {cancelText}
          </button>
          <button onClick={() => { onConfirm(); }}
            className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-lg ${v.confirm}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}