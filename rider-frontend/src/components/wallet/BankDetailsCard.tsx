import { BadgeCheck, Building2, Hash, Pencil, User } from "lucide-react";

import { maskAccountNumber, type BankAccount } from "../../data/rider-wallet-mock";
import { SummaryRow } from "./WalletPrimitives";

export function BankDetailsCard({
  bank,
  onEdit,
}: {
  bank: BankAccount;
  onEdit?: () => void;
}) {
  return (
    <section className="card-soft animate-rise border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm font-black tracking-tight text-foreground">
            Bank Details
          </h2>
          {bank.verified ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-brand-green">
              <BadgeCheck className="size-3" />
              Verified
            </span>
          ) : null}
        </div>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-2xl border border-border bg-card px-3 text-[0.7rem] font-black tracking-tight text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.97]"
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
        ) : null}
      </div>


      <div className="mt-2">
        <SummaryRow icon={Building2} label="Bank Name" value={bank.bankName} />
        <SummaryRow icon={User} label="Account Holder" value={bank.accountHolder} />
        <SummaryRow icon={Hash} label="Account Number" value={maskAccountNumber(bank.accountNumber)} />
        <SummaryRow icon={Hash} label="IFSC" value={bank.ifsc} />
        <SummaryRow icon={Building2} label="Branch" value={bank.branch} />
      </div>
    </section>
  );
}