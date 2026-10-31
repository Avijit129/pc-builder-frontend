// lib/detail-specs.ts
// Readable names for the spec tables on a component page (step B2).
//
// The API sends specs as groups, and each group is an object of column name
// to value:  { clocks: { base_clock_ghz: 3.8, boost_clock_ghz: 5.0 } }
// This file turns those names into text people can read:
//   clocks          ->  "Clock speeds"
//   base_clock_ghz  ->  "Base clock" + " GHz"
//
// It is the same idea as lib/list-specs.ts, but for the detail page.
//
// How it works:
// - Groups and rows keep the ORDER the API sends them. Nothing is sorted here.
// - There is ONE label per column name for all 8 component types. That works
//   because a name means the same thing everywhere (length_mm is always a length).
// - A name that is not in the tables below still shows. It gets a plain label
//   made from the column name ("some_new_column" -> "Some new column").
//   To give it a nicer label or a unit, add ONE line to SPEC_LABELS.
// - Unknown data (null) is shown as "Unknown", never as 0 (API rule).

import { formatSpecValue, humanize } from "@/lib/format";
import type { SpecField } from "@/lib/list-specs";
import type { Specs } from "@/lib/types";

/** A label for one column: the text, plus an optional unit after a number. */
export type SpecLabel = Omit<SpecField, "key">;

/* -------------------------------------------------------------------------- */
/* Group titles (the heading of each table)                                   */
/* -------------------------------------------------------------------------- */

const GROUP_LABELS: Record<string, string> = {
  // CPU
  processing: "Processing",
  clocks: "Clock speeds",
  cache: "Cache",
  power: "Power",
  memory: "Memory",
  pcie: "PCI Express",
  graphics: "Integrated graphics",
  platform: "Platform",
  cooling: "Cooling",
  capabilities: "Capabilities",

  // GPU
  chipset: "Graphics chip",
  outputs: "Display outputs",
  physical: "Physical size",

  // Motherboard
  size: "Size",
  expansion: "Expansion slots",
  storage: "Storage",
  networking: "Networking",
  audio: "Audio",
  io: "Ports (I/O)",
  // "Hardware features", so it is not confused with the Features section below.
  features: "Hardware features",

  // RAM
  capacity: "Capacity",
  timings: "Timings and voltage",
  profiles: "Overclock profiles",
  design: "Design",

  // SSD
  performance: "Performance",
  controller: "Controller and memory",
  endurance: "Endurance",

  // PSU
  warranty: "Warranty",

  // Case
  dimensions: "Dimensions",
  compatibility: "Compatibility",
  front_io: "Front ports",

  // CPU cooler
  fan: "Fan",
  radiator: "Radiator and pump",
  heatsink: "Heatsink",

  // Every type
  extra: "Additional specs",
};

/* -------------------------------------------------------------------------- */
/* Column labels (the left side of each row)                                  */
/* -------------------------------------------------------------------------- */

const SPEC_LABELS: Record<string, SpecLabel> = {
  // ---- CPU ----
  cores: { label: "Cores" },
  threads: { label: "Threads" },
  performance_cores: { label: "Performance cores" },
  efficiency_cores: { label: "Efficiency cores" },
  hyper_threading: { label: "Hyper-Threading" },
  simultaneous_multithreading: { label: "Simultaneous multithreading" },
  base_clock_ghz: { label: "Base clock", suffix: " GHz" },
  boost_clock_ghz: { label: "Boost clock", suffix: " GHz" },
  performance_core_base_ghz: { label: "P-core base clock", suffix: " GHz" },
  performance_core_boost_ghz: { label: "P-core boost clock", suffix: " GHz" },
  efficiency_core_base_ghz: { label: "E-core base clock", suffix: " GHz" },
  efficiency_core_boost_ghz: { label: "E-core boost clock", suffix: " GHz" },
  l1_cache_kb: { label: "L1 cache", suffix: " KB" },
  l2_cache_kb: { label: "L2 cache", suffix: " KB" },
  l3_cache_mb: { label: "L3 cache", suffix: " MB" },
  process_nm: { label: "Process", suffix: " nm" },
  tdp_watts: { label: "TDP", suffix: " W" },
  default_tdp_watts: { label: "Default TDP", suffix: " W" },
  maximum_power_watts: { label: "Maximum power", suffix: " W" },
  max_temperature_c: { label: "Max temperature", suffix: " °C" },
  memory_type: { label: "Memory type" },
  memory_channels: { label: "Memory channels" },
  max_memory_gb: { label: "Max memory", suffix: " GB" },
  max_memory_speed_mhz: { label: "Max memory speed", suffix: " MHz" },
  ecc_support: { label: "ECC support" },
  pcie_version: { label: "PCIe version" },
  pcie_lanes: { label: "PCIe lanes" },
  has_integrated_graphics: { label: "Integrated graphics" },
  integrated_gpu_name: { label: "Graphics name" },
  integrated_gpu_cores: { label: "Graphics cores" },
  integrated_gpu_clock_ghz: { label: "Graphics clock", suffix: " GHz" },
  display_output_support: { label: "Display outputs" },
  socket: { label: "Socket" },
  platform: { label: "Platform" },
  chipset_family: { label: "Chipset family" },
  package_width_mm: { label: "Package width", suffix: " mm" },
  package_height_mm: { label: "Package height", suffix: " mm" },
  included_cooler: { label: "Included cooler" },
  recommended_cooler_type: { label: "Recommended cooler" },
  unlocked_multiplier: { label: "Unlocked multiplier" },
  overclocking_supported: { label: "Overclocking" },
  virtualization: { label: "Virtualization" },
  aes_support: { label: "AES" },
  avx_support: { label: "AVX" },
  avx2_support: { label: "AVX2" },
  avx512_support: { label: "AVX-512" },

  // ---- GPU ----
  name: { label: "Name" },
  chip_code: { label: "Chip code" },
  architecture: { label: "Architecture" },
  shading_units: { label: "Shading units" },
  rt_cores: { label: "RT cores" },
  tensor_cores: { label: "Tensor cores" },
  vram_gb: { label: "VRAM", suffix: " GB" },
  memory_bus_width: { label: "Memory bus width", suffix: " bit" },
  memory_speed_mbps: { label: "Memory speed", suffix: " Mbps" },
  base_clock_mhz: { label: "Base clock", suffix: " MHz" },
  boost_clock_mhz: { label: "Boost clock", suffix: " MHz" },
  recommended_psu_watts: { label: "Recommended PSU", suffix: " W" },
  power_connectors: { label: "Power connectors" },
  hdmi_ports: { label: "HDMI ports" },
  displayport_ports: { label: "DisplayPort ports" },
  max_displays_supported: { label: "Max displays" },
  max_resolution_supported: { label: "Max resolution" },
  slot_width: { label: "Slot width" },
  cooling_type: { label: "Cooling type" },
  has_backplate: { label: "Backplate" },

  // ---- Motherboard ----
  chipset: { label: "Chipset" },
  chipset_tier: { label: "Chipset tier" },
  chipset_overclocking_support: { label: "Overclocking support" },
  form_factor: { label: "Form factor" },
  memory_slots: { label: "Memory slots" },
  max_memory_speed_mts: { label: "Max memory speed", suffix: " MT/s" },
  xmp_support: { label: "XMP support" },
  expo_support: { label: "EXPO support" },
  pcie_x16_slots: { label: "PCIe x16 slots" },
  pcie_x1_slots: { label: "PCIe x1 slots" },
  m2_slots: { label: "M.2 slots" },
  sata_ports: { label: "SATA ports" },
  raid_support: { label: "RAID support" },
  lan_chipset: { label: "LAN chipset" },
  lan_speed_mbps: { label: "LAN speed", suffix: " Mbps" },
  wifi_support: { label: "Wi-Fi" },
  wifi_standard: { label: "Wi-Fi standard" },
  bluetooth_version: { label: "Bluetooth version" },
  audio_chipset: { label: "Audio chipset" },
  audio_channels: { label: "Audio channels" },
  usb_a_ports: { label: "USB-A ports" },
  usb_c_ports: { label: "USB-C ports" },
  thunderbolt_support: { label: "Thunderbolt" },
  power_phases: { label: "Power phases" },
  cpu_power_connector: { label: "CPU power connector" },
  bios_flashback: { label: "BIOS Flashback" },
  fan_headers: { label: "Fan headers" },
  rgb_headers: { label: "RGB headers" },

  // ---- RAM ----
  speed_mts: { label: "Speed", suffix: " MT/s" },
  jedec_speed: { label: "JEDEC speed" },
  registered: { label: "Registered (RDIMM)" },
  rank: { label: "Rank" },
  modules_qty: { label: "Modules" },
  capacity_per_module_gb: { label: "Capacity per module", suffix: " GB" },
  total_capacity_gb: { label: "Total capacity", suffix: " GB" },
  cas_latency: { label: "CAS latency" },
  timings: { label: "Timings" },
  voltage: { label: "Voltage", suffix: " V" },
  xmp_version: { label: "XMP version" },
  heat_spreader: { label: "Heat spreader" },
  intended_platform: { label: "Intended platform" },

  // ---- SSD ----
  capacity_gb: { label: "Capacity", suffix: " GB" },
  interface: { label: "Interface" },
  protocol: { label: "Protocol" },
  nvme_version: { label: "NVMe version" },
  sequential_read_mbps: { label: "Sequential read", suffix: " MB/s" },
  sequential_write_mbps: { label: "Sequential write", suffix: " MB/s" },
  random_read_iops: { label: "Random read", suffix: " IOPS" },
  random_write_iops: { label: "Random write", suffix: " IOPS" },
  controller: { label: "Controller" },
  nand_type: { label: "NAND type" },
  dram_cache: { label: "DRAM cache" },
  dram_cache_size_mb: { label: "DRAM cache size", suffix: " MB" },
  dram_less: { label: "DRAM-less" },
  endurance_tbw: { label: "Endurance", suffix: " TBW" },
  mtbf_hours: { label: "MTBF", suffix: " hours" },
  warranty_years: { label: "Warranty", suffix: " years" },
  has_heatsink: { label: "Heatsink" },
  encryption_support: { label: "Encryption" },

  // ---- PSU ----
  wattage: { label: "Wattage", suffix: " W" },
  efficiency_rating: { label: "Efficiency rating" },
  pfc_type: { label: "PFC type" },
  input_voltage_range: { label: "Input voltage" },
  modular_type: { label: "Modular type" },
  fan_bearing_type: { label: "Fan bearing" },
  zero_rpm_mode: { label: "Zero RPM mode" },

  // ---- Case ----
  case_type: { label: "Case type" },
  material: { label: "Material" },
  side_panel_type: { label: "Side panel" },
  has_rgb_lighting: { label: "RGB lighting" },
  depth_mm: { label: "Depth", suffix: " mm" },
  weight_kg: { label: "Weight", suffix: " kg" },
  volume_liters: { label: "Volume", suffix: " L" },
  supported_form_factors: { label: "Supported motherboards" },
  max_gpu_length_mm: { label: "Max GPU length", suffix: " mm" },
  max_cpu_cooler_height_mm: { label: "Max CPU cooler height", suffix: " mm" },
  max_psu_length_mm: { label: "Max PSU length", suffix: " mm" },
  psu_form_factor: { label: "PSU form factor" },
  psu_shroud: { label: "PSU shroud" },
  psu_included: { label: "PSU included" },
  supports_liquid_cooling: { label: "Liquid cooling support" },
  expansion_slots: { label: "Expansion slots" },
  drive_bays_35: { label: "3.5-inch drive bays" },
  drive_bays_25: { label: "2.5-inch drive bays" },
  drive_bays_525: { label: "5.25-inch drive bays" },
  front_usb_a_ports: { label: "Front USB-A ports" },
  front_usb_c_ports: { label: "Front USB-C ports" },
  front_audio_jack: { label: "Front audio jack" },
  included_fans_count: { label: "Included fans" },

  // ---- CPU cooler ----
  cooler_type: { label: "Cooler type", humanize: true },
  max_tdp_support_watts: { label: "Max TDP support", suffix: " W" },
  base_material: { label: "Base material" },
  supported_sockets: { label: "Supported sockets" },
  fan_count: { label: "Fan count" },
  fan_size_mm: { label: "Fan size", suffix: " mm" },
  fan_speed_min_rpm: { label: "Min fan speed", suffix: " RPM" },
  fan_speed_max_rpm: { label: "Max fan speed", suffix: " RPM" },
  fan_airflow_cfm: { label: "Airflow", suffix: " CFM" },
  noise_level_min_dba: { label: "Min noise level", suffix: " dBA" },
  noise_level_max_dba: { label: "Max noise level", suffix: " dBA" },
  pwm_support: { label: "PWM support" },
  radiator_size_mm: { label: "Radiator size", suffix: " mm" },
  radiator_thickness_mm: { label: "Radiator thickness", suffix: " mm" },
  tubing_length_mm: { label: "Tubing length", suffix: " mm" },
  pump_speed_rpm: { label: "Pump speed", suffix: " RPM" },
  pump_noise_level_dba: { label: "Pump noise level", suffix: " dBA" },
  heatpipe_count: { label: "Heat pipes" },
  tower_count: { label: "Towers" },
  rgb_type: { label: "RGB type" },

  // ---- Used by more than one type ----
  length_mm: { label: "Length", suffix: " mm" },
  width_mm: { label: "Width", suffix: " mm" },
  height_mm: { label: "Height", suffix: " mm" },
  weight_g: { label: "Weight", suffix: " g" },
  rgb: { label: "RGB lighting" },
  color: { label: "Color" },
};

/* -------------------------------------------------------------------------- */
/* Lookups                                                                    */
/* -------------------------------------------------------------------------- */

// Object.hasOwn: so a free "extra" key like "constructor" is never mistaken
// for a label. Unknown names get a plain label made from the name.
function groupLabel(groupKey: string): string {
  return Object.hasOwn(GROUP_LABELS, groupKey)
    ? GROUP_LABELS[groupKey]
    : humanize(groupKey);
}

function specLabel(columnKey: string): SpecLabel {
  return Object.hasOwn(SPEC_LABELS, columnKey)
    ? SPEC_LABELS[columnKey]
    : { label: humanize(columnKey) };
}

/** True when the value is real data. null, "" and an empty list are "unknown". */
function isKnown(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;

  if (Array.isArray(value)) return value.length > 0;

  return true;
}

// One value -> text. formatSpecValue (lib/format.ts) does most of the work.
function formatDetailValue(value: unknown, label: SpecLabel): string {
  // Safety net: MySQL sends decimals as text ("4.20"). The API is meant to turn
  // them into numbers, but if one slips through, formatSpecValue would skip the
  // unit. A column with a unit is always a number, so we convert it here.
  if (
    label.suffix &&
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(Number(value))
  ) {
    return formatSpecValue(Number(value), label);
  }

  // The free "extra" group can hold objects. Never print "[object Object]".
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return JSON.stringify(value);
  }

  return formatSpecValue(value, label);
}

/* -------------------------------------------------------------------------- */
/* What the component renders                                                 */
/* -------------------------------------------------------------------------- */

export type SpecRow = {
  /** The column name from the API. Used as the React key. */
  key: string;
  label: string;
  /** Text for the screen. "Unknown" when the data is missing. */
  value: string;
  /** false when the value is "Unknown", so the page can show it quieter. */
  known: boolean;
};

export type SpecSection = {
  /** The group name from the API, for example "clocks". */
  key: string;
  title: string;
  rows: SpecRow[];
};

/**
 * Turns the "specs" object of a component into a list of tables.
 *
 * A group is skipped when:
 * - it is null (for example a GPU without a chipset), or
 * - it is not an object (PHP sends [] instead of {} for an empty "extra"), or
 * - EVERY value in it is unknown. A table full of "Unknown" helps nobody.
 *
 * Inside a group that has some data, single unknown values still show as
 * "Unknown", so the visitor sees what we do not know.
 */
export function buildSpecSections(specs: Specs): SpecSection[] {
  const sections: SpecSection[] = [];

  for (const [groupKey, group] of Object.entries(specs)) {
    if (group === null || typeof group !== "object" || Array.isArray(group)) {
      continue;
    }

    const entries = Object.entries(group);

    if (!entries.some(([, value]) => isKnown(value))) continue;

    sections.push({
      key: groupKey,
      title: groupLabel(groupKey),
      rows: entries.map(([columnKey, value]) => {
        const label = specLabel(columnKey);

        return {
          key: columnKey,
          label: label.label,
          value: formatDetailValue(value, label),
          known: isKnown(value),
        };
      }),
    });
  }

  return sections;
}
