// lib/list-specs.ts
// Which specs a card shows on the list page, per component type.
// "key" is the name inside item.specs (see docs/frontend-api.md, section 3).
// To show another spec, add a line here. No other file needs to change.

import type { ComponentType } from "@/lib/types";

export type SpecField = {
  key: string;
  label: string;
  /** Added after a number, for example " GHz". */
  suffix?: string;
  /** Turn "aio_liquid" into "Aio liquid". */
  humanize?: boolean;
};

export const LIST_SPECS: Record<ComponentType, SpecField[]> = {
  cpu: [
    { key: "socket", label: "Socket" },
    { key: "cores", label: "Cores" },
    { key: "threads", label: "Threads" },
    { key: "boost_clock_ghz", label: "Boost clock", suffix: " GHz" },
    { key: "tdp_watts", label: "TDP", suffix: " W" },
  ],
  gpu: [
    { key: "chipset", label: "Chipset" },
    { key: "vram_gb", label: "VRAM", suffix: " GB" },
    { key: "memory_type", label: "Memory" },
    { key: "tdp_watts", label: "TDP", suffix: " W" },
    { key: "length_mm", label: "Length", suffix: " mm" },
  ],
  motherboard: [
    { key: "socket", label: "Socket" },
    { key: "chipset", label: "Chipset" },
    { key: "form_factor", label: "Size" },
    { key: "memory_type", label: "Memory" },
    { key: "m2_slots", label: "M.2 slots" },
  ],
  ram: [
    { key: "memory_type", label: "Type" },
    { key: "speed_mts", label: "Speed", suffix: " MT/s" },
    { key: "total_capacity_gb", label: "Capacity", suffix: " GB" },
    { key: "modules_qty", label: "Modules" },
    { key: "cas_latency", label: "CAS latency" },
  ],
  ssd: [
    { key: "capacity_gb", label: "Capacity", suffix: " GB" },
    { key: "form_factor", label: "Size" },
    { key: "interface", label: "Interface" },
    { key: "sequential_read_mbps", label: "Read speed", suffix: " MB/s" },
    { key: "sequential_write_mbps", label: "Write speed", suffix: " MB/s" },
  ],
  psu: [
    { key: "wattage", label: "Power", suffix: " W" },
    { key: "efficiency_rating", label: "Efficiency" },
    { key: "modular_type", label: "Modular" },
    { key: "form_factor", label: "Size" },
  ],
  pc_case: [
    { key: "case_type", label: "Type" },
    { key: "supported_form_factors", label: "Motherboards" },
    { key: "max_gpu_length_mm", label: "Max GPU length", suffix: " mm" },
    {
      key: "max_cpu_cooler_height_mm",
      label: "Max cooler height",
      suffix: " mm",
    },
    { key: "side_panel_type", label: "Side panel" },
  ],
  cpu_cooler: [
    { key: "cooler_type", label: "Type", humanize: true },
    { key: "supported_sockets", label: "Sockets" },
    { key: "max_tdp_support_watts", label: "Max TDP", suffix: " W" },
    { key: "height_mm", label: "Height", suffix: " mm" },
  ],
};
