import { FileSpreadsheet, FileText } from "lucide-react";

/**
 * Sprint 3.6 — export bar. UI only: no file is generated yet.
 * TODO(api): POST /api/partner/wallet/export?format=pdf|xlsx
 */
export function WalletExportBar({ onExport }: { onExport: (format: "pdf" | "excel") => void }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onExport("pdf")}
        className="focus-key card-soft flex items-center justify-center gap-2 border border-border py-3 text-xs font-black tracking-tight text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.97]"
      >
        <FileText className="size-4 text-brand-dark" />
        Export PDF
      </button>
      <button
        type="button"
        onClick={() => onExport("excel")}
        className="focus-key card-soft flex items-center justify-center gap-2 border border-border py-3 text-xs font-black tracking-tight text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.97]"
      >
        <FileSpreadsheet className="size-4 text-brand-green" />
        Export Excel
      </button>
    </div>
  );
}
