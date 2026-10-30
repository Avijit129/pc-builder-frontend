// lib/site.ts
// One place for site-wide settings and the 8 component categories.
// Header, footer, homepage (and later: list pages, sitemap) all read from here.

import {
  Box,
  CircuitBoard,
  Cpu,
  Fan,
  HardDrive,
  MemoryStick,
  Monitor,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ComponentType } from "@/lib/types";

// Placeholder name. Change it here and it changes everywhere.
export const SITE_NAME = "PC Builder";

export const SITE_DESCRIPTION =
  "Compare PC parts, check compatibility and track prices before you build.";

// Used for canonical URLs and Open Graph. Set NEXT_PUBLIC_SITE_URL in
// .env.local for production (for example https://www.example.com).
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type Category = {
  /** Type key used in API responses and saved builds. */
  type: ComponentType;
  /** Website URL part: /cpu, /gpu, /case ... */
  segment: string;
  /** Laravel API path (without the host): /api + this. */
  apiPath: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

// Order = the order of the menu and the homepage cards.
// The segment / apiPath / type values come from docs/frontend-api.md, section 2.
export const CATEGORIES: Category[] = [
  {
    type: "cpu",
    segment: "cpu",
    apiPath: "/cpus",
    label: "CPUs",
    description: "Compare cores, clock speeds and sockets.",
    icon: Cpu,
  },
  {
    type: "gpu",
    segment: "gpu",
    apiPath: "/gpus",
    label: "GPUs",
    description: "Graphics cards by memory, power and size.",
    icon: Monitor,
  },
  {
    type: "motherboard",
    segment: "motherboard",
    apiPath: "/motherboards",
    label: "Motherboards",
    description: "Sockets, chipsets and memory support.",
    icon: CircuitBoard,
  },
  {
    type: "ram",
    segment: "ram",
    apiPath: "/rams",
    label: "RAM",
    description: "Memory kits by type, speed and capacity.",
    icon: MemoryStick,
  },
  {
    type: "ssd",
    segment: "ssd",
    apiPath: "/ssds",
    label: "SSDs",
    description: "SATA and NVMe storage drives.",
    icon: HardDrive,
  },
  {
    type: "psu",
    segment: "psu",
    apiPath: "/psus",
    label: "PSUs",
    description: "Power supplies by wattage and efficiency.",
    icon: Zap,
  },
  {
    type: "pc_case",
    segment: "case",
    apiPath: "/cases",
    label: "Cases",
    description: "Check size, clearance and cooling support.",
    icon: Box,
  },
  {
    type: "cpu_cooler",
    segment: "cpu-cooler",
    apiPath: "/cpu-coolers",
    label: "CPU Coolers",
    description: "Air and liquid coolers by socket.",
    icon: Fan,
  },
];

/** Find a category by its URL part ("cpu", "case" ...). Returns undefined if unknown. */
export function getCategoryBySegment(segment: string): Category | undefined {
  return CATEGORIES.find((category) => category.segment === segment);
}
