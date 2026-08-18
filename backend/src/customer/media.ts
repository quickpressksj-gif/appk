/**
 * Media resolver — maps backend image keys to bundled QuickPress artwork.
 *
 * The API stores stable image *keys* (e.g. "store-1", "item-shoes") instead of
 * binary URLs so the same document works in mock mode, on FastAPI and on a CDN
 * later. Anything that already looks like a URL is passed straight through.
 */

import itemBlanket from "@shared/assets/item-blanket.jpg";
import itemCarpet from "@shared/assets/item-carpet.jpg";
import itemCurtain from "@shared/assets/item-curtain.jpg";
import itemDryClean from "@shared/assets/item-dry-clean.jpg";
import itemExpress from "@shared/assets/item-express.jpg";
import itemPremium from "@shared/assets/item-premium.jpg";
import itemShoes from "@shared/assets/item-shoes.jpg";
import itemSteamIron from "@shared/assets/item-steam-iron.jpg";
import itemWashFold from "@shared/assets/item-wash-fold.jpg";
import serviceHero from "@shared/assets/service-hero.jpg";
import store1 from "@shared/assets/store-1.jpg";
import store2 from "@shared/assets/store-2.jpg";
import store3 from "@shared/assets/store-3.jpg";

const MEDIA: Record<string, string> = {
  "store-1": store1,
  "store-2": store2,
  "store-3": store3,
  "service-hero": serviceHero,
  "item-wash-fold": itemWashFold,
  "item-dry-clean": itemDryClean,
  "item-steam-iron": itemSteamIron,
  "item-premium": itemPremium,
  "item-express": itemExpress,
  "item-shoes": itemShoes,
  "item-blanket": itemBlanket,
  "item-curtain": itemCurtain,
  "item-carpet": itemCarpet,
};

const FALLBACKS = [store1, store2, store3, serviceHero];

/** Resolve an API image key/URL to a renderable src. */
export function resolveMedia(value: string | null | undefined, seed = 0): string {
  if (!value) return FALLBACKS[Math.abs(seed) % FALLBACKS.length] ?? store1;
  if (/^(https?:|data:|blob:|\/)/.test(value)) return value;
  const key = value.replace(/\.(jpg|jpeg|png|webp)$/i, "");
  return MEDIA[key] ?? FALLBACKS[Math.abs(seed) % FALLBACKS.length] ?? store1;
}

export function resolveMediaList(values: (string | null | undefined)[]): string[] {
  return values.map((value, index) => resolveMedia(value, index));
}
