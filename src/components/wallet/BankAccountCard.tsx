import { Landmark, Pencil } from "lucide-react";
import { useState } from "react";

import { SectionHeading } from "../PartnerPrimitives";
import { maskAccountNumber, type BankAccount } from "../../data/partner-wallet-mock";
import { WalletSheet } from "./WalletSheet";

/** Sprint 3.6 — bank account card with UI-only edit sheet. */
export function BankAccountCard({
  account,
  onSave,
}: {
  account: BankAccount;
  onSave: (next: BankAccount) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(account);

  const rows = [
    { label: "Account Holder", value: account.holder },
    { label: "Bank Name", value: account.bankName },
    { label: "Account Number", value: maskAccountNumber(account.accountNumber) },
    { label: "IFSC", value: account.ifsc },
  ];

  return (
    <section className="mt-7">
      <SectionHeading
        title="Bank Account"
        action={
          <button
            type="button"
            onClick={() => {
              setDraft(account);
              setOpen(true);
            }}
            className="focus-key flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-[0.68rem] font-black tracking-tight text-brand-dark transition-all duration-300 active:scale-[0.96]"
          >
            <Pencil className="size-3" />
            Edit
          </button>
        }
      />

      <div className="animate-slide-up card-soft mt-4 border border-border p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
            <Landmark className="size-4" />
          </span>
          <p className="min-w-0 flex-1 truncate text-sm font-bold tracking-tight text-foreground">
            Settlement Account
          </p>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
          {rows.map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
                {row.label}
              </dt>
              <dd className="truncate text-[0.78rem] font-bold text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <WalletSheet
        open={open}
        title="Edit Bank Account"
        subtitle="UI only — changes are not sent to a server yet"
        onClose={() => setOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => {
              onSave(draft);
              setOpen(false);
            }}
            className="ripple w-full rounded-2xl bg-primary py-3.5 text-sm font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97]"
          >
            Save Account
          </button>
        }
      >
        <div className="space-y-3">
          {(
            [
              { key: "holder", label: "Account Holder" },
              { key: "bankName", label: "Bank Name" },
              { key: "accountNumber", label: "Account Number" },
              { key: "ifsc", label: "IFSC" },
            ] as const
          ).map((field) => (
            <label key={field.key} className="block">
              <span className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
                {field.label}
              </span>
              <input
                value={draft[field.key]}
                onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                className="field-focus mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground outline-none"
              />
            </label>
          ))}
        </div>
      </WalletSheet>
    </section>
  );
}
