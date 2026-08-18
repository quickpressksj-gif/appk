import { Camera, PenLine, ShieldCheck, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { RiderBottomSheet, RiderPrimaryButton } from "../RiderPrimitives";

/**
 * Delivery proof capture — UI placeholders only. Camera, storage upload,
 * signature pad and OTP verification are wired in a later sprint.
 */
export function DeliveryProofSheet({
  open,
  onClose,
  orderId,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  onConfirm?: () => void;
}) {
  const [otp, setOtp] = useState("");

  return (
    <RiderBottomSheet open={open} onClose={onClose} title={`Delivery proof · ${orderId}`}>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => toast("Camera capture — coming soon")}
          className="flex min-h-11 w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/50 p-4 text-left active:scale-[0.98]"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
            <Camera className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black tracking-tight text-foreground">
              Capture delivery photo
            </span>
            <span className="block text-[0.7rem] font-medium text-muted-foreground">
              Camera placeholder
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => toast("Photo upload — coming soon")}
          className="flex min-h-11 w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left active:scale-[0.98]"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Upload className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black tracking-tight text-foreground">
              Upload photo
            </span>
            <span className="block text-[0.7rem] font-medium text-muted-foreground">
              Storage upload placeholder
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => toast("Signature capture — coming soon")}
          className="flex min-h-11 w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left active:scale-[0.98]"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <PenLine className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black tracking-tight text-foreground">
              Customer signature
            </span>
            <span className="block text-[0.7rem] font-medium text-muted-foreground">
              Signature pad placeholder
            </span>
          </span>
        </button>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-black tracking-tight text-foreground">
            <ShieldCheck className="size-4 text-brand-green" />
            OTP verification
          </p>
          <p className="mt-1 text-[0.7rem] font-medium text-muted-foreground">
            Placeholder — the live OTP is validated by the backend later.
          </p>
          <input
            value={otp}
            inputMode="numeric"
            maxLength={4}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            aria-label="Delivery OTP"
            placeholder="4-digit OTP"
            className="mt-3 min-h-11 w-full rounded-2xl border border-border bg-background px-4 text-center text-lg font-black tracking-[0.5em] text-foreground outline-none focus:border-primary/70"
          />
        </div>

        <RiderPrimaryButton
          onClick={() => {
            toast.success("Delivery proof saved (mock)");
            onConfirm?.();
            onClose();
          }}
        >
          Save proof
        </RiderPrimaryButton>
      </div>
    </RiderBottomSheet>
  );
}
