import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Banknote,
  CreditCard,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Smartphone,
  Star,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PaymentsSkeleton } from "@/components/account/AccountSkeletons";
import { BottomNav } from "@/components/home/BottomNav";
import { ScreenTopBar } from "@/components/rewards/ScreenTopBar";
import { Toaster } from "@/shared/ui/sonner";
import {
  addPaymentMethod,
  fetchPaymentMethods,
  updatePaymentMethod,
  PAYMENT_KIND_LABEL,
  removePaymentMethod,
  setDefaultPaymentMethod,
  type PaymentKind,
  type PaymentMethod,
  type PaymentProvider,
} from "@/api/customer/payments-api";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export const Route = createFileRoute("/payment-methods")({
  head: () => ({
    meta: [
      { title: "Payment Methods — QuickPress Secure Checkout" },
      {
        name: "description",
        content:
          "Manage QuickPress payment methods — UPI, debit and credit cards, wallet and cash on delivery. Set a default, add new options and pay securely.",
      },
      { property: "og:title", content: "Payment Methods — QuickPress" },
      {
        property: "og:description",
        content:
          "Add, remove and set default UPI, card, wallet and cash payment options for your QuickPress laundry orders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaymentMethodsScreen,
});

const KIND_META: Record<PaymentKind, { icon: typeof CreditCard; tone: string }> = {
  upi: { icon: Smartphone, tone: "bg-secondary/10 text-brand-green" },
  "debit-card": { icon: CreditCard, tone: "bg-primary/15 text-brand-dark" },
  "credit-card": { icon: CreditCard, tone: "bg-primary/15 text-brand-dark" },
  wallet: { icon: Wallet, tone: "bg-secondary/10 text-brand-green" },
  cod: { icon: Banknote, tone: "bg-muted text-muted-foreground" },
  razorpay: { icon: CreditCard, tone: "bg-primary/15 text-brand-dark" },
};

const KINDS = Object.keys(PAYMENT_KIND_LABEL) as PaymentKind[];

function PaymentMethodsScreen() {
  useAuthGuard();
  const navigate = useNavigate();
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [kind, setKind] = useState<PaymentKind>("upi");
  const [name, setName] = useState("");
  const [masked, setMasked] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // GET /api/payment-methods and GET /api/payment-providers
    // GET /api/payment-methods — saved methods + provider catalogue in one call.
    void fetchPaymentMethods()
      .then((result) => {
        if (!active) return;
        setMethods(result.methods);
        setProviders(result.providers);
      })
      .catch(() => {
        if (active) setMethods([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setKind("upi");
    setName("");
    setMasked("");
    setSheetOpen(true);
  };

  const openEdit = (method: PaymentMethod) => {
    setEditingId(method.id);
    setKind(method.kind);
    setName(method.name);
    setMasked(method.masked);
    setSheetOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editingId) {
      // PUT /api/payment-methods/{id}
      await updatePaymentMethod(editingId, { kind, name, masked });
      setMethods((prev) =>
        prev
          ? prev.map((item) => (item.id === editingId ? { ...item, kind, name, masked } : item))
          : prev,
      );
      toast.success("Payment method updated");
    } else {
      // POST /api/payment-methods
      const created = await addPaymentMethod({ kind, name, masked });
      setMethods((prev) => (prev ? [...prev, created] : [created]));
      toast.success("Payment method added");
    }
    setSaving(false);
    setSheetOpen(false);
  };

  const handleRemove = async (id: string) => {
    setBusyId(id);
    // TODO: replace with DELETE /api/payment-methods/{id}
    await removePaymentMethod(id);
    setMethods((prev) => (prev ? prev.filter((item) => item.id !== id) : prev));
    setBusyId(null);
    toast.success("Payment method removed");
  };

  const handleDefault = async (id: string) => {
    setBusyId(id);
    await setDefaultPaymentMethod(id);
    setMethods((prev) =>
      prev ? prev.map((item) => ({ ...item, isDefault: item.id === id })) : prev,
    );
    setBusyId(null);
    toast.success("Default payment updated");
  };

  const handleLinkProvider = (providerName: string) => {
    // TODO: replace with POST /api/payment-methods
    setEditingId(null);
    setKind(providerName === "Razorpay" ? "credit-card" : "upi");
    setName(providerName);
    setMasked("");
    setSheetOpen(true);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden scroll-smooth bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <ScreenTopBar
          title="Payment Methods"
          action={
            <button
              type="button"
              aria-label="Add payment method"
              onClick={openAdd}
              className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.94]"
            >
              <Plus className="size-5" />
            </button>
          }
        />

        {!methods ? (
          <PaymentsSkeleton />
        ) : (
          <div className="px-5 pb-32 pt-4">
            {/* Saved methods — GET /api/payment-methods */}
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black tracking-tight text-foreground">
                  Saved Payment Methods
                </h2>
                <span className="text-[0.68rem] font-semibold text-muted-foreground">
                  {methods.length} saved
                </span>
              </div>

              <div className="stagger-children mt-4 space-y-3">
                {methods.map((method, index) => {
                  const meta = KIND_META[method.kind];
                  const Icon = meta.icon;
                  return (
                    <article
                      key={method.id} className="card-soft border border-border p-4 transition-all duration-300 hover:border-primary/60"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${meta.tone}`}
                        >
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-bold tracking-tight text-foreground">
                              {method.name}
                            </h3>
                            {method.isDefault ? (
                              <span className="animate-pop rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-green">
                                Default
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 font-mono text-xs tracking-wide text-muted-foreground">
                            {method.masked}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                            {PAYMENT_KIND_LABEL[method.kind]} · {method.note}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(method)}
                          className="ripple flex h-9 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-muted text-[0.72rem] font-bold text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.96]"
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={busyId === method.id || method.isDefault}
                          onClick={() => void handleDefault(method.id)}
                          className={`ripple flex h-9 flex-1 items-center justify-center gap-1.5 rounded-2xl text-[0.72rem] font-bold transition-all duration-300 active:scale-[0.96] disabled:opacity-50 ${
                            method.isDefault
                              ? "bg-secondary/15 text-brand-green"
                              : "bg-primary/20 text-foreground hover:bg-primary/30"
                          }`}
                        >
                          {busyId === method.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Star className="size-3.5" />
                          )}
                          {method.isDefault ? "Default" : "Set Default"}
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${method.name}`}
                          disabled={busyId === method.id}
                          onClick={() => void handleRemove(method.id)}
                          className="ripple flex size-9 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive transition-all duration-300 hover:bg-destructive/20 active:scale-[0.94] disabled:opacity-45"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Providers */}
            <section className="mt-7">
              <h2 className="text-sm font-black tracking-tight text-foreground">Payment Options</h2>
              <div className="stagger-children mt-4 grid grid-cols-2 gap-3">
                {providers.map((provider, index) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => {
                      if (provider.id === "wallet" || provider.kind === "wallet") {
                        navigate({ to: "/wallet" });
                      } else {
                        handleLinkProvider(provider.name);
                      }
                    }}
                    className="card-soft ripple flex items-center gap-3 border border-border p-4 text-left transition-all duration-300 hover:border-primary/60 active:scale-[0.96]"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-dark text-[0.7rem] font-black text-primary">
                      {provider.initials}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[0.8rem] font-bold leading-tight text-foreground">
                        {provider.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {provider.tagline}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Security */}
            <section className="mt-7">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand-dark to-brand-green p-5 shadow-soft">
                <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-primary/25 blur-2xl" />
                <div className="relative flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-background/15 text-background">
                    <ShieldCheck className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-black tracking-tight text-background">
                      100% Secure Payments
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-background/75">
                      All payments are secured with bank-grade encryption. QuickPress never stores
                      your full card number or UPI PIN.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Add / edit payment sheet — POST /api/payment-methods */}
      {sheetOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSheetOpen(false)}
            className="animate-overlay-in absolute inset-0 bg-brand-dark/50 backdrop-blur-sm"
          />
          <div className="animate-sheet-up relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-4xl bg-card px-5 pb-10 pt-4 shadow-soft">
            <div className="mx-auto h-1.5 w-10 rounded-full bg-border" />
            <div className="mt-4 flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight text-foreground">
                {editingId ? "Edit Payment Method" : "Add Payment Method"}
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSheetOpen(false)}
                className="flex size-9 items-center justify-center rounded-2xl bg-muted text-muted-foreground transition-colors hover:bg-accent"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Payment Type
              </span>
              <div className="stagger-children mt-2 grid grid-cols-2 gap-2">
                {KINDS.map((item) => {
                  const Icon = KIND_META[item].icon;
                  const active = kind === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setKind(item)}
                      className={`flex h-12 items-center justify-center gap-1.5 rounded-2xl border text-[0.75rem] font-bold transition-all duration-300 active:scale-[0.96] ${
                        active
                          ? "border-primary bg-primary/15 text-brand-dark"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                      {PAYMENT_KIND_LABEL[item]}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="mt-4 block">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Name on Method
              </span>
              <input
                value={name}
                placeholder="HDFC Regalia Credit Card"
                onChange={(event) => setName(event.target.value)}
                className="mt-1.5 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none transition-colors placeholder:font-medium placeholder:text-muted-foreground/70 focus:border-primary"
              />
            </label>

            <label className="mt-3 block">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {kind === "upi" ? "UPI ID" : "Card / Reference Number"}
              </span>
              <input
                value={masked}
                placeholder={kind === "upi" ? "name@okhdfcbank" : "•••• •••• •••• 4821"}
                onChange={(event) => setMasked(event.target.value)}
                className="mt-1.5 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none transition-colors placeholder:font-medium placeholder:text-muted-foreground/70 focus:border-primary"
              />
            </label>

            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 shrink-0" />
              Encrypted and tokenised · never stored in plain text
            </p>

            <div className="sticky bottom-0 -mx-5 -mb-10 mt-6 bg-card/95 px-5 pb-8 pt-3 backdrop-blur-md">
              <button
                type="button"
                disabled={saving || !name.trim() || !masked.trim()}
                onClick={() => void handleSave()}
                className="ripple flex h-13 w-full items-center justify-center gap-2 rounded-3xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97] disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                Save Payment Method
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <BottomNav active="payments" />
      <Toaster />
    </main>
  );
}
