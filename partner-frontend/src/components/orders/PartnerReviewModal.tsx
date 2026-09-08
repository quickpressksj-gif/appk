import { useState } from "react";
import { Star, X, Sparkles, Bike, User, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitPartnerOrderReview, PartnerReviewPayload } from "@/api/partner/partner-orders-api";

interface PartnerReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderCode?: string;
  customerName?: string;
  riderName?: string;
  onSuccess?: () => void;
}

const RIDER_TAGS = [
  "Punctual Arrival",
  "Careful Garment Handling",
  "Polite Demeanor",
  "Quick Handover Verification",
  "Professional Conduct",
];

const CUSTOMER_TAGS = [
  "Accurate Garment Count",
  "Well-Sorted Laundry Bag",
  "Responsive on Call",
  "Polite Customer",
  "Prompt Doorstep Delivery Handover",
];

export function PartnerReviewModal({
  isOpen,
  onClose,
  orderId,
  orderCode,
  customerName = "Customer",
  riderName = "Delivery Captain",
  onSuccess,
}: PartnerReviewModalProps) {
  const [riderRating, setRiderRating] = useState(5);
  const [riderHover, setRiderHover] = useState(0);
  const [riderFeedback, setRiderFeedback] = useState("");
  const [selectedRiderTags, setSelectedRiderTags] = useState<string[]>([
    "Punctual Arrival",
    "Careful Garment Handling",
  ]);

  const [customerRating, setCustomerRating] = useState(5);
  const [customerHover, setCustomerHover] = useState(0);
  const [customerFeedback, setCustomerFeedback] = useState("");
  const [selectedCustomerTags, setSelectedCustomerTags] = useState<string[]>([
    "Accurate Garment Count",
  ]);

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleRiderTag = (tag: string) => {
    setSelectedRiderTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleCustomerTag = (tag: string) => {
    setSelectedCustomerTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: PartnerReviewPayload = {
        riderRating,
        riderFeedback: riderFeedback.trim() || undefined,
        riderTags: selectedRiderTags,
        customerRating,
        customerFeedback: customerFeedback.trim() || undefined,
        customerTags: selectedCustomerTags,
      };

      await submitPartnerOrderReview(orderId, payload);
      toast.success("Ratings submitted successfully! Captain & Customer reputations updated.");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-[#00C853] border border-emerald-200">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-black">
                Rate Captain & Customer
              </h3>
              <p className="text-[11px] font-bold text-neutral-500">Order #{orderCode || orderId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 active:scale-95 transition-all"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          {/* SECTION 1: RATE DELIVERY CAPTAIN */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/20 p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-xl bg-[#00C853] text-white">
                  <Bike className="size-4" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-black uppercase tracking-wide">
                    Rate Delivery Captain
                  </h4>
                  <p className="text-[11px] font-bold text-neutral-600">{riderName}</p>
                </div>
              </div>
              <span className="text-xs font-black text-[#00C853] bg-emerald-100/60 px-2 py-0.5 rounded-full">
                {riderRating} / 5
              </span>
            </div>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRiderRating(star)}
                  onMouseEnter={() => setRiderHover(star)}
                  onMouseLeave={() => setRiderHover(0)}
                  className="p-1 transition-transform hover:scale-115 active:scale-95"
                >
                  <Star
                    className={`size-7 transition-colors ${
                      star <= (riderHover || riderRating)
                        ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                        : "fill-neutral-100 text-neutral-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Quick Tags */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1.5">
                Quick Highlights
              </p>
              <div className="flex flex-wrap gap-1.5">
                {RIDER_TAGS.map((tag) => {
                  const active = selectedRiderTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleRiderTag(tag)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all ${
                        active
                          ? "bg-[#00C853] text-white shadow-xs"
                          : "bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-300"
                      }`}
                    >
                      {active ? `✓ ${tag}` : `+ ${tag}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Comment */}
            <div>
              <textarea
                value={riderFeedback}
                onChange={(e) => setRiderFeedback(e.target.value)}
                placeholder="Write feedback for delivery partner (optional)..."
                rows={2}
                className="w-full rounded-xl border border-neutral-200 bg-white p-2.5 text-xs font-semibold text-black placeholder:text-neutral-400 focus:border-[#00C853] focus:outline-hidden"
              />
            </div>
          </div>

          {/* SECTION 2: RATE CUSTOMER */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/40 p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-xl bg-neutral-800 text-white">
                  <User className="size-4" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-black uppercase tracking-wide">
                    Rate Customer
                  </h4>
                  <p className="text-[11px] font-bold text-neutral-600">{customerName}</p>
                </div>
              </div>
              <span className="text-xs font-black text-neutral-800 bg-neutral-200/70 px-2 py-0.5 rounded-full">
                {customerRating} / 5
              </span>
            </div>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setCustomerRating(star)}
                  onMouseEnter={() => setCustomerHover(star)}
                  onMouseLeave={() => setCustomerHover(0)}
                  className="p-1 transition-transform hover:scale-115 active:scale-95"
                >
                  <Star
                    className={`size-7 transition-colors ${
                      star <= (customerHover || customerRating)
                        ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                        : "fill-neutral-100 text-neutral-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Quick Tags */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1.5">
                Customer Behavior & Laundry Packing
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CUSTOMER_TAGS.map((tag) => {
                  const active = selectedCustomerTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleCustomerTag(tag)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all ${
                        active
                          ? "bg-neutral-900 text-white shadow-xs"
                          : "bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-300"
                      }`}
                    >
                      {active ? `✓ ${tag}` : `+ ${tag}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Comment */}
            <div>
              <textarea
                value={customerFeedback}
                onChange={(e) => setCustomerFeedback(e.target.value)}
                placeholder="Write feedback for customer (optional)..."
                rows={2}
                className="w-full rounded-xl border border-neutral-200 bg-white p-2.5 text-xs font-semibold text-black placeholder:text-neutral-400 focus:border-[#00C853] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Trust Badge & Submit CTA */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-neutral-500">
              <ShieldCheck className="size-4 text-[#00C853]" />
              Ratings build platform trust & verified partner reputational scores
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-[#00C853] hover:bg-[#00B248] text-white font-black text-sm shadow-md active:scale-98 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Submitting Ratings...
                </>
              ) : (
                "Submit Mutual Ratings ⭐"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
