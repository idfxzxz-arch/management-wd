import { X } from "lucide-react";

export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-hidden rounded-t-xl border border-slate-200 bg-white shadow-soft sm:max-w-xl sm:rounded-lg">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="min-w-0 truncate text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>
          <button className="rounded p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Tutup modal">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[calc(92vh-58px)] overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
