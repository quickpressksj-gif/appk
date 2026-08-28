import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  Edit2,
  Landmark,
  Loader2,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { SectionHeading } from "../../components/RiderPrimitives";
import { RiderBellAction, RiderTopBar } from "../../components/RiderTopBar";
import { SummaryRow, WalletPanel } from "../../components/wallet/WalletPrimitives";
import { WalletHomeSkeleton } from "../../components/wallet/WalletSkeletons";
import {
  fetchRiderBank,
  updateRiderBank,
  type RiderBankAccount,
} from "@/api/rider/rider-profile-api";

export function BankDetailsScreen() {
  const [bank, setBank] = useState<RiderBankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    bankName: "",
    accountNumber: "",
    ifsc: "",
    accountHolder: "",
    upiId: "",
  });

  const loadData = async () => {
    try {
      const data = await fetchRiderBank();
      setBank(data);
      setForm({
        bankName: data.bankName || "State Bank of India",
        accountNumber: data.accountNumber || "",
        ifsc: data.ifsc || "SBIN0001234",
        accountHolder: data.accountHolder || "",
        upiId: data.upiId || "",
      });
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bankName.trim() || !form.accountNumber.trim() || !form.ifsc.trim()) {
      toast.error("Please fill all required bank details");
      return;
    }
    setSubmitting(true);
    try {
      await updateRiderBank(form);
      toast.success("Bank & Payout account updated successfully in database!");
      await loadData();
      setIsEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update bank details");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Bank & Payout Details"
          subtitle="Where your trip earnings and weekly payouts are settled"
          action={<RiderBellAction count={0} />}
        />

        {loading ? (
          <WalletHomeSkeleton />
        ) : (
          <div className="px-5 pb-32 pt-4 space-y-5">
            {/* Primary Bank Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 p-6 text-white shadow-xl border border-slate-800">
              <div className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-400 backdrop-blur">
                    <Landmark className="size-6" />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-base font-black tracking-tight text-white">
                        {bank?.bankName || "State Bank of India"}
                      </p>
                      <BadgeCheck className="size-4 text-emerald-400" />
                    </div>
                    <p className="text-xs font-semibold text-slate-300">
                      {bank?.accountHolder || "Delivery Partner"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur transition-all hover:bg-white/20 active:scale-95"
                >
                  <Edit2 className="size-3.5" />
                  {isEditing ? "Close" : "Edit"}
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Account Number
                  </p>
                  <p className="mt-0.5 text-sm font-black text-white">
                    {bank?.accountNumber || "•••• •••• 4821"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    IFSC Code
                  </p>
                  <p className="mt-0.5 text-sm font-black text-emerald-400">
                    {bank?.ifsc || "SBIN0001234"}
                  </p>
                </div>
              </div>

              {bank?.upiId && (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 border border-white/10">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                    <QrCode className="size-3.5 text-emerald-400" />
                    UPI ID: {bank.upiId}
                  </span>
                  <span className="text-[10px] font-black uppercase text-emerald-400">Linked</span>
                </div>
              )}
            </div>

            {/* Edit Bank Form Sheet */}
            {isEditing && (
              <form
                onSubmit={handleSave}
                className="animate-rise rounded-3xl border border-emerald-500/40 bg-card p-5 shadow-lg space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-emerald-600" />
                  <h3 className="text-sm font-black text-foreground">
                    Update Bank Account & UPI
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground">Bank Name</label>
                    <input
                      type="text"
                      value={form.bankName}
                      onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                      placeholder="e.g. HDFC Bank, SBI, ICICI"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={form.accountNumber}
                        onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                        placeholder="Account No."
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={form.ifsc}
                        onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })}
                        placeholder="e.g. HDFC0001234"
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold uppercase text-foreground outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={form.accountHolder}
                      onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                      placeholder="Full Name as on passbook"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground">
                      Direct Payout UPI ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={form.upiId}
                      onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                      placeholder="e.g. 9258730561@paytm"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 rounded-xl border border-border bg-muted py-2.5 text-xs font-bold text-foreground active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white shadow-md active:scale-95 disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    Save Bank Details
                  </button>
                </div>
              </form>
            )}

            {/* Settlement Info Panel */}
            <section>
              <SectionHeading title="Payout Settlement Schedule" />
              <WalletPanel className="mt-3">
                <SummaryRow icon={Landmark} label="Settlement Cycle" value="Every Tuesday (T+2)" />
                <SummaryRow
                  icon={ShieldCheck}
                  label="Transfer Method"
                  value="Direct IMPS / NEFT / UPI"
                />
                <SummaryRow
                  icon={CreditCard}
                  label="Verification Status"
                  value="Bank Account Active & Verified ✓"
                />
              </WalletPanel>
            </section>
          </div>
        )}
      </div>
      <Toaster />
    </main>
  );
}
