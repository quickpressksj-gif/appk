import {
  Blinds,
  Footprints,
  Grid2x2,
  Shirt,
  Sparkles,
  WashingMachine,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";

import type { ServiceIconKey } from "../../data/partner-services-mock";

const ICONS: Record<ServiceIconKey, LucideIcon> = {
  wash: WashingMachine,
  dryclean: Shirt,
  iron: Wind,
  premium: Sparkles,
  shoe: Footprints,
  blanket: Waves,
  curtain: Blinds,
  carpet: Grid2x2,
};

export function serviceIcon(key: ServiceIconKey): LucideIcon {
  return ICONS[key];
}

export const SERVICE_ICON_KEYS = Object.keys(ICONS) as ServiceIconKey[];
