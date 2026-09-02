import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  Eraser,
  FileCheck2,
  FileText,
  Lock,
  PenTool,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export interface CaptainAgreementSignatureData {
  signatureUrl: string;
  signedAt: string;
  signerName: string;
  signerAadhaar?: string;
  agreementVersion: string;
  consentAgreed: boolean;
}

interface CaptainAgreementSignaturePadProps {
  captainName: string;
  mobile: string;
  aadhaar?: string;
  city?: string;
  vehicleNumber?: string;
  onSignatureConfirmed: (data: CaptainAgreementSignatureData) => void;
  initialSignature?: string;
}

export function CaptainAgreementSignaturePad({
  captainName,
  mobile,
  aadhaar,
  city,
  vehicleNumber,
  onSignatureConfirmed,
  initialSignature,
}: CaptainAgreementSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(Boolean(initialSignature));
  const [signatureData, setSignatureData] = useState<string>(initialSignature || "");
  const [adoptedMode, setAdoptedMode] = useState<"draw" | "adopt">("draw");
  const [consentChecked, setConsentChecked] = useState(Boolean(initialSignature));
  const [activeTab, setActiveTab] = useState<"agreement" | "signature">("signature");

  const effectiveSignerName = captainName || "Delivery Captain";
  const rawAadhaar = (aadhaar || "").replace(/\s/g, "");
  const maskedAadhaar = rawAadhaar.length >= 4 ? `XXXX-XXXX-${rawAadhaar.slice(-4)}` : "Verified Captain ID";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = initialSignature;
    }
  }, [initialSignature]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (adoptedMode !== "draw") return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || adoptedMode !== "draw") return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setSignatureData("");
  };

  const adoptSuggestedSignature = (fontFamily: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = `italic 36px ${fontFamily}, cursive`;
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(effectiveSignerName, rect.width / 2, rect.height / 2);

    const data = canvas.toDataURL("image/png");
    setSignatureData(data);
    setHasDrawn(true);
  };

  const handleConfirm = () => {
    if (!hasDrawn || !signatureData) {
      toast.error("Please provide your digital signature before continuing");
      return;
    }
    if (!consentChecked) {
      toast.error("Please check the declaration checkbox to accept the Captain terms");
      return;
    }

    const payload: CaptainAgreementSignatureData = {
      signatureUrl: signatureData,
      signedAt: new Date().toISOString(),
      signerName: effectiveSignerName,
      signerAadhaar: rawAadhaar || undefined,
      agreementVersion: "v2.2-2026",
      consentAgreed: true,
    };

    onSignatureConfirmed(payload);
    toast.success("Captain Agreement Signed & Verified Successfully!");
  };

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
              <FileCheck2 className="size-4" />
            </span>
            <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
              QuickPress Delivery Captain Agreement
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Digitally sign your independent delivery captain contract (IT Act 2000 Section 10A).
          </p>
        </div>

        {/* Tab switch between Agreement Text and Signature Pad */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("signature")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "signature"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <PenTool className="size-3.5" />
            <span>Digital Signature</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("agreement")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "agreement"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <FileText className="size-3.5" />
            <span>Read Terms</span>
          </button>
        </div>
      </div>

      {activeTab === "agreement" ? (
        /* Legal Contract Text View */
        <div className="max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-[11px] leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
          <div className="border-b border-slate-200 pb-2 dark:border-slate-800">
            <p className="font-bold text-slate-900 dark:text-white">
              QUICKPRESS LOGISTICS CAPTAIN PARTNER SERVICE CONTRACT
            </p>
            <p className="text-[10px] text-slate-500">
              Contract Version: QP-CAP-2026-V2.2 | Jurisdiction: Kasganj / Uttar Pradesh
            </p>
          </div>

          <p>
            This Delivery Captain Independent Contractor Agreement is entered into between{" "}
            <strong className="text-slate-900 dark:text-white">{effectiveSignerName}</strong> (Mobile:{" "}
            <strong>{mobile}</strong>, Aadhaar: <strong>{maskedAadhaar}</strong>) and{" "}
            <strong>QuickPress Online Laundry Services Pvt. Ltd.</strong>
          </p>

          <div className="space-y-1.5">
            <p className="font-bold text-slate-800 dark:text-slate-200">1. Independent Contractor Status</p>
            <p>
              The Captain acts as an independent delivery contractor and is not an employee of QuickPress. The
              Captain may choose their online login hours and delivery zones freely.
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="font-bold text-slate-800 dark:text-slate-200">2. Real-Time OTP Verification</p>
            <p>
              Every laundry pickup requires a verified 4-digit Customer Pickup OTP. Every doorstep delivery
              requires a verified 4-digit Customer Delivery OTP. Captains must never deliver packages without OTP
              entry.
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="font-bold text-slate-800 dark:text-slate-200">3. Garment Care & Safety</p>
            <p>
              The Captain guarantees safe, waterproof transit of clean garments between the customer and partner hub
              using standard laundry transit bags.
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="font-bold text-slate-800 dark:text-slate-200">4. Payouts & Weekly Settlements</p>
            <p>
              Per-drop earnings, mileage allowances, and surge incentives are credited instantly to the in-app
              Captain Wallet. Direct bank withdrawals and auto-settlements occur every Monday.
            </p>
          </div>
        </div>
      ) : (
        /* Digital Signature Canvas View */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAdoptedMode("draw")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  adoptedMode === "draw"
                    ? "bg-amber-400 font-bold text-black"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                Draw Signature
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdoptedMode("adopt");
                  adoptSuggestedSignature("Brush Script MT");
                }}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  adoptedMode === "adopt"
                    ? "bg-amber-400 font-bold text-black"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <Sparkles className="size-3" />
                Auto-Style
              </button>
            </div>

            <button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Eraser className="size-3" />
              <span>Clear</span>
            </button>
          </div>

          {/* Interactive HTML5 Canvas */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/20 dark:border-amber-500/30 dark:bg-slate-950">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="h-36 w-full cursor-crosshair touch-none"
            />
            {!hasDrawn && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                <PenTool className="size-6 opacity-40" />
                <p className="mt-1 text-xs font-medium">Sign above with your finger or stylus</p>
                <p className="text-[10px] text-slate-400">Signatory: {effectiveSignerName}</p>
              </div>
            )}
          </div>

          {/* Verification Badge */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-[10px] text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>Signatory: <strong>{effectiveSignerName}</strong></span>
            </span>
            <span>Aadhaar: <strong>{maskedAadhaar}</strong></span>
          </div>
        </div>
      )}

      {/* Consent Checkbox */}
      <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-50/30 p-3 dark:border-amber-500/10 dark:bg-amber-500/5">
        <input
          type="checkbox"
          checked={consentChecked}
          onChange={(e) => setConsentChecked(e.target.checked)}
          className="mt-0.5 size-4 rounded border-amber-400 text-amber-500 focus:ring-amber-400"
        />
        <div className="text-[11px] leading-snug text-slate-700 dark:text-slate-300">
          <p className="font-bold text-slate-900 dark:text-white">
            I accept the QuickPress Delivery Captain Terms & Conditions
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
            I confirm that I possess a valid Driving License, Roadworthy Vehicle ({vehicleNumber || "Two-Wheeler"}),
            and agree to conduct deliveries safely following doorstep OTP guidelines.
          </p>
        </div>
      </label>

      {/* Sign Confirmation Action Button */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!hasDrawn || !consentChecked}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3 text-xs font-black text-black shadow-md transition-all hover:bg-amber-300 active:scale-[0.98] disabled:opacity-50"
      >
        <Check className="size-4 stroke-[2.5]" />
        <span>Confirm Digital Signature & Proceed</span>
      </button>
    </div>
  );
}
