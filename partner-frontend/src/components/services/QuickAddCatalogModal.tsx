import {
  Check,
  Clock,
  Layers,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

import { usePartnerServices } from "../../context/PartnerServicesContext";
import { partnerRoutes } from "../../navigation/partner-routes";
import type { ServiceCategoryId } from "../../data/partner-services-mock";

type CatalogTemplate = {
  id: string;
  name: string;
  category: ServiceCategoryId;
  categoryName: string;
  iconEmoji: string;
  price: number;
  unit: "kg" | "piece" | "pair" | "fixed";
  estimatedHours: number;
  description: string;
  minOrderValue: number;
};

export const STANDARD_CATALOG: CatalogTemplate[] = [
  {
    id: "std-wash-fold",
    name: "Wash & Fold",
    category: "wash",
    categoryName: "Wash & Fold",
    iconEmoji: "🧺",
    price: 79,
    unit: "kg",
    estimatedHours: 24,
    description: "Daily wear clothes washed, dried and neatly folded.",
    minOrderValue: 199,
  },
  {
    id: "std-wash-iron",
    name: "Wash & Steam Iron",
    category: "wash",
    categoryName: "Wash & Fold",
    iconEmoji: "👔",
    price: 99,
    unit: "kg",
    estimatedHours: 24,
    description: "Complete wash, fabric conditioner and crisp steam press.",
    minOrderValue: 199,
  },
  {
    id: "std-steam-iron",
    name: "Steam Ironing",
    category: "iron",
    categoryName: "Steam Iron",
    iconEmoji: "⚡",
    price: 19,
    unit: "piece",
    estimatedHours: 12,
    description: "Crisp wrinkle-free finish with temperature-controlled steam.",
    minOrderValue: 99,
  },
  {
    id: "std-dry-clean",
    name: "Dry Cleaning",
    category: "dry-clean",
    categoryName: "Dry Clean",
    iconEmoji: "🧥",
    price: 149,
    unit: "piece",
    estimatedHours: 48,
    description: "Specialized eco-friendly dry clean for suits, blazers and delicate fabrics.",
    minOrderValue: 249,
  },
  {
    id: "std-shoe-care",
    name: "Shoe Cleaning & Spa",
    category: "shoe-care",
    categoryName: "Shoe Care",
    iconEmoji: "👟",
    price: 249,
    unit: "pair",
    estimatedHours: 48,
    description: "Deep cleaning, deodorizing and protection for sneakers and leather shoes.",
    minOrderValue: 249,
  },
  {
    id: "std-curtain",
    name: "Curtain Cleaning",
    category: "home-care",
    categoryName: "Home Care",
    iconEmoji: "🪟",
    price: 199,
    unit: "piece",
    estimatedHours: 48,
    description: "Specialized curtain and drape dust extraction, washing and steaming.",
    minOrderValue: 299,
  },
  {
    id: "std-blanket",
    name: "Blanket & Quilt Cleaning",
    category: "home-care",
    categoryName: "Home Care",
    iconEmoji: "🛏️",
    price: 299,
    unit: "piece",
    estimatedHours: 48,
    description: "Deep sanitized wash for heavy blankets, quilts, and comforters.",
    minOrderValue: 299,
  },
  {
    id: "std-carpet",
    name: "Carpet & Rug Deep Clean",
    category: "home-care",
    categoryName: "Home Care",
    iconEmoji: "🧶",
    price: 399,
    unit: "piece",
    estimatedHours: 72,
    description: "Deep shampooing, stain removal and dust-mite extraction for rugs and carpets.",
    minOrderValue: 399,
  },
  {
    id: "std-express",
    name: "Express Laundry (6 Hours)",
    category: "wash",
    categoryName: "Express",
    iconEmoji: "🚀",
    price: 129,
    unit: "kg",
    estimatedHours: 6,
    description: "Priority express washing, drying and pressing delivered within 6 hours.",
    minOrderValue: 249,
  },
  {
    id: "std-premium-silk",
    name: "Premium Silk & Saree Care",
    category: "premium",
    categoryName: "Premium",
    iconEmoji: "✨",
    price: 299,
    unit: "piece",
    estimatedHours: 48,
    description: "Delicate hand wash and specialized steam rolling for silk sarees and lehengas.",
    minOrderValue: 299,
  },
];

import { fetchMasterCatalogServices } from "@/api/partner/partner-services-api";

export function QuickAddCatalogModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { services, addService } = usePartnerServices();
  const [search, setSearch] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [catalogList, setCatalogList] = useState<CatalogTemplate[]>(STANDARD_CATALOG);

  useEffect(() => {
    let alive = true;
    fetchMasterCatalogServices().then((items) => {
      if (alive && items.length > 0) {
        const dynamicTemplates: CatalogTemplate[] = items.map((it) => {
          let category: ServiceCategoryId = "wash";
          const lower = it.name.toLowerCase();
          if (lower.includes("iron")) category = "iron";
          else if (lower.includes("dry")) category = "dry-clean";
          else if (lower.includes("shoe")) category = "shoe-care";
          else if (lower.includes("curtain") || lower.includes("blanket")) category = "home-care";
          else if (lower.includes("express")) category = "wash";
          else if (lower.includes("saree") || lower.includes("silk")) category = "premium";

          return {
            id: `admin-${it.id}`,
            name: it.name,
            category,
            categoryName: it.name,
            iconEmoji: "🧺",
            price: it.price,
            unit: (it.unit as any) || "piece",
            estimatedHours: it.defaultHours || 24,
            description: it.desc || "Professional platform service standard.",
            minOrderValue: it.price,
          };
        });

        // Merge keeping standard fallbacks for any missing items
        const map = new Map<string, CatalogTemplate>();
        for (const t of STANDARD_CATALOG) map.set(t.name.toLowerCase(), t);
        for (const t of dynamicTemplates) map.set(t.name.toLowerCase(), t);
        setCatalogList(Array.from(map.values()));
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const existingNames = useMemo(
    () => new Set(services.map((s) => s.name.trim().toLowerCase())),
    [services],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalogList;
    return catalogList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.categoryName.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }, [search, catalogList]);

  if (!open) return null;

  const handleAdd = async (tpl: CatalogTemplate) => {
    setAddingId(tpl.id);
    try {
      await addService({
        name: tpl.name,
        category: tpl.category,
        icon: "premium",
        description: tpl.description,
        price: tpl.price,
        unit: tpl.unit,
        estimatedHours: tpl.estimatedHours,
        minOrderValue: tpl.minOrderValue,
        enabled: true,
        imageLabel: null,
      });
      toast.success(`"${tpl.name}" added to your live rate card!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add service");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-overlay-in absolute inset-0 bg-black/50 backdrop-blur-xs"
      />

      <div className="animate-sheet-up relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl border border-zinc-200 bg-white p-5 shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
              <Sparkles className="size-4" />
            </span>
            <div>
              <h2 className="text-base font-black text-zinc-900">Add Service to Rate Card</h2>
              <p className="text-[11px] font-medium text-zinc-500">
                Choose standard catalog services or create a custom service
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search & Custom Service CTA */}
        <div className="mt-3.5 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search catalog services (e.g. Dry Clean, Iron, Shoes)..."
              className="h-10 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-xs font-bold text-zinc-900 placeholder:text-zinc-400 focus:border-amber-400 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate({ to: partnerRoutes.serviceNew });
            }}
            className="flex w-full items-center justify-between rounded-2xl border border-amber-300 bg-amber-50/70 px-3.5 py-2.5 text-xs font-black text-amber-950 transition-all hover:bg-amber-100 active:scale-[0.98]"
          >
            <span className="flex items-center gap-2">
              <Plus className="size-4 text-amber-700" />
              <span>+ Create Custom Service (Custom Name / Rate)</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Open Form ›</span>
          </button>
        </div>

        {/* Catalog List */}
        <div className="no-scrollbar mt-3 flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
          {filtered.map((tpl) => {
            const alreadyAdded = existingNames.has(tpl.name.trim().toLowerCase());
            const isAdding = addingId === tpl.id;

            return (
              <div
                key={tpl.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/90 bg-white p-3 shadow-2xs transition-all hover:border-amber-400/80"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-base">
                    {tpl.iconEmoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-xs font-black text-zinc-900">{tpl.name}</h4>
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-zinc-600">
                        {tpl.categoryName}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-zinc-500">
                      {tpl.description}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                      <span className="text-xs font-black text-zinc-950">
                        ₹{tpl.price} <span className="text-[10px] text-zinc-500 font-normal">/{tpl.unit}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-zinc-400" /> {tpl.estimatedHours}h
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {alreadyAdded ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      <Check className="size-3" /> Added
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isAdding}
                      onClick={() => handleAdd(tpl)}
                      className="flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-black text-zinc-950 shadow-xs transition-transform active:scale-95 hover:bg-amber-300 disabled:opacity-50"
                    >
                      <Plus className="size-3.5" strokeWidth={3} />
                      <span>{isAdding ? "Adding..." : "Add"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
          <span>You can edit prices anytime after adding.</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-zinc-800 hover:text-zinc-950"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
