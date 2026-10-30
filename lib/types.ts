// lib/types.ts
// Types for the Laravel Frontend API.
// Source: docs/frontend-api.md in the Laravel repository.
// Rule from the API: unknown data is null, never 0. Show null as "Unknown".

/* -------------------------------------------------------------------------- */
/* Basics                                                                     */
/* -------------------------------------------------------------------------- */

/** Single-item responses are wrapped like this: { data: ... } */
export type ApiData<T> = { data: T };

/** Error body. A 422 also has "errors". Show errors[field][0] next to the input. */
export type ApiErrorBody = {
  message: string;
  errors?: Record<string, string[]>;
};

/** Every list endpoint returns this shape. */
export type Paginated<T> = {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
    path: string;
    /** Ready-made page buttons. */
    links: { url: string | null; label: string; active: boolean }[];
  };
};

/** The "type key" used in responses and in saved build parts. */
export type ComponentType =
  | "cpu"
  | "gpu"
  | "motherboard"
  | "ram"
  | "ssd"
  | "psu"
  | "pc_case"
  | "cpu_cooler";

/* -------------------------------------------------------------------------- */
/* List items (section 3 of the API reference)                                */
/* -------------------------------------------------------------------------- */

export type ListItem<Specs> = {
  id: number;
  name: string;
  slug: string;
  manufacturer: { name: string; slug: string } | null;
  image: string | null;
  /** Cheapest IN-STOCK price. null means no in-stock price. */
  lowest_price: number | null;
  specs: Specs;
};

export type CpuListSpecs = {
  socket: string | null;
  cores: number | null;
  threads: number | null;
  base_clock_ghz: number | null;
  boost_clock_ghz: number | null;
  tdp_watts: number | null;
  memory_type: string | null;
  has_integrated_graphics: boolean;
};

export type GpuListSpecs = {
  chipset: string | null;
  vram_gb: number | null;
  memory_type: string | null;
  boost_clock_mhz: number | null;
  tdp_watts: number | null;
  recommended_psu_watts: number | null;
  power_connectors: string | null;
  length_mm: number | null;
  slot_width: string | null;
};

export type MotherboardListSpecs = {
  socket: string | null;
  chipset: string | null;
  form_factor: string | null;
  memory_type: string | null;
  memory_slots: number | null;
  max_memory_gb: number | null;
  max_memory_speed_mts: number | null;
  m2_slots: number | null;
};

export type RamListSpecs = {
  memory_type: string;
  speed_mts: number | null;
  modules_qty: number | null;
  capacity_per_module_gb: number | null;
  total_capacity_gb: number | null;
  cas_latency: number | null;
  form_factor: string;
};

export type SsdListSpecs = {
  capacity_gb: number | null;
  form_factor: string;
  interface: string;
  protocol: string | null;
  sequential_read_mbps: number | null;
  sequential_write_mbps: number | null;
};

export type PsuListSpecs = {
  wattage: number | null;
  efficiency_rating: string | null;
  form_factor: string;
  modular_type: string;
  length_mm: number | null;
};

export type PcCaseListSpecs = {
  case_type: string | null;
  side_panel_type: string | null;
  /** Motherboard sizes that fit. */
  supported_form_factors: string[];
  psu_form_factor: string | null;
  max_gpu_length_mm: number | null;
  max_cpu_cooler_height_mm: number | null;
  max_psu_length_mm: number | null;
  supports_liquid_cooling: boolean;
};

export type CpuCoolerListSpecs = {
  cooler_type: string;
  /** Sockets the cooler fits. */
  supported_sockets: string[];
  height_mm: number | null;
  radiator_size_mm: number | null;
  max_tdp_support_watts: number | null;
};

export type CpuListItem = ListItem<CpuListSpecs>;
export type GpuListItem = ListItem<GpuListSpecs>;
export type MotherboardListItem = ListItem<MotherboardListSpecs>;
export type RamListItem = ListItem<RamListSpecs>;
export type SsdListItem = ListItem<SsdListSpecs>;
export type PsuListItem = ListItem<PsuListSpecs>;
export type PcCaseListItem = ListItem<PcCaseListSpecs>;
export type CpuCoolerListItem = ListItem<CpuCoolerListSpecs>;

/* -------------------------------------------------------------------------- */
/* Component page (section 4)                                                 */
/* -------------------------------------------------------------------------- */

export type Offer = {
  id: number;
  retailer: { name: string; slug: string; logo: string | null } | null;
  price: number;
  original_price: number | null;
  /** For example "USD". */
  currency: string;
  in_stock: boolean;
  availability: string | null;
  /** The ONE link for the Buy button (affiliate link first). */
  buy_url: string | null;
  /** true: add rel="sponsored" and show an affiliate notice. */
  is_affiliate: boolean;
  checked_at: string | null;
};

export type ComponentImage = {
  url: string;
  alt: string | null;
  title: string | null;
  type: string;
  is_primary: boolean;
};

export type ComponentFeature = {
  name: string;
  slug: string;
  description: string | null;
  is_supported: boolean;
};

export type Seo = {
  title: string;
  description: string;
  canonical_url: string;
  path: string;
  robots: { index: boolean; follow: boolean };
  open_graph: {
    type: string;
    site_name: string;
    url: string;
    title: string;
    description: string;
    image: string | null;
  };
  twitter: {
    card: "summary" | "summary_large_image";
    title: string;
    description: string;
    image: string | null;
  };
  breadcrumbs: { name: string; path: string; url: string }[];
  /** JSON-LD: a Product and a BreadcrumbList. One <script> tag each. */
  structured_data: Record<string, unknown>[];
};

/** One value inside a spec group. Lists appear in cases and coolers. */
export type SpecValue = string | number | boolean | null | string[];

/** A group is an object of column name to value, for example "clocks". */
export type SpecGroup = Record<string, SpecValue>;

/**
 * All spec groups of a component. Every value can be null.
 * The group names differ per type (see the table in the API reference).
 * "extra" is a free object or null. For a GPU, "chipset" can be null.
 */
export type Specs = Record<string, SpecGroup | null>;

export type ComponentDetail = {
  id: number;
  name: string;
  slug: string;
  model_number: string | null;
  series: string | null;
  /** YYYY-MM-DD */
  release_date: string | null;
  launch_price_usd: number | null;
  market_status: string | null;
  description: string | null;
  official_url: string | null;
  manufacturer: {
    name: string;
    slug: string;
    website_url: string | null;
  } | null;
  /** Main image: the primary one, else the old image column. */
  image: string | null;
  images: ComponentImage[];
  /** Cheapest in-stock price. */
  lowest_price: number | null;
  /** In stock first, then cheapest first. */
  prices: Offer[];
  specs: Specs;
  features: ComponentFeature[];
  seo: Seo;
};

export type CpuBenchmark = {
  name: string;
  version: string | null;
  test_type: string | null;
  score: number | null;
  single_core_score: number | null;
  multi_core_score: number | null;
  unit: string | null;
  source_name: string | null;
  source_url: string | null;
  tested_at: string | null;
};

export type GpuBenchmark = {
  name: string;
  version: string | null;
  test_type: string | null;
  resolution: string | null;
  quality_preset: string | null;
  ray_tracing_enabled: boolean | null;
  avg_fps: number | null;
  one_percent_low_fps: number | null;
  score: number | null;
  unit: string | null;
  source_name: string | null;
  source_url: string | null;
  tested_at: string | null;
};

export type PsuCable = {
  type: string | null;
  code: string | null;
  category: string | null;
  pin_count: number | null;
  quantity: number;
  connectors_per_cable: number;
  cable_length_mm: number | null;
  is_modular: boolean;
  is_sleeved: boolean;
  color: string | null;
};

export type CaseFanMount = {
  position: "front" | "rear" | "top" | "bottom" | "side";
  fan_size_mm: number;
  max_fan_count: number;
  included_fan_count: number;
  max_radiator_size_mm: number | null;
};

// Each type = the common fields + its own extra top-level fields.
export type CpuDetail = ComponentDetail & {
  part_number: string | null;
  family: string | null;
  generation: string | null;
  architecture: string | null;
  benchmarks: CpuBenchmark[];
};
export type GpuDetail = ComponentDetail & {
  part_number: string | null;
  benchmarks: GpuBenchmark[];
};
export type MotherboardDetail = ComponentDetail;
export type RamDetail = ComponentDetail & { part_number: string | null };
export type SsdDetail = ComponentDetail & { part_number: string | null };
export type PsuDetail = ComponentDetail & { cables: PsuCable[] };
export type PcCaseDetail = ComponentDetail & { fan_mounts: CaseFanMount[] };
export type CpuCoolerDetail = ComponentDetail;

/* -------------------------------------------------------------------------- */
/* Brands and sitemaps (section 5)                                            */
/* -------------------------------------------------------------------------- */

export type Brand = {
  name: string;
  slug: string;
  /** For example /cpu/amd */
  path: string;
  products_count: number;
};

export type BrandList = {
  data: Brand[];
  meta: {
    type: string;
    path: string;
    singular: string;
    plural: string;
  };
};

export type SitemapEntry = {
  /** Components: the type key. Listings: "category" or "brand". */
  type: string;
  /** For example /cpu/amd/ryzen-7-7800x3d */
  path: string;
  /** Absolute URL, built from FRONTEND_URL. */
  url: string;
  lastmod: string | null;
  changefreq: string | null;
  priority: number | null;
};

/* -------------------------------------------------------------------------- */
/* Compatibility (section 6)                                                  */
/* -------------------------------------------------------------------------- */

/** Show "unknown" as "Could not check", never as green. */
export type CompatibilityStatus =
  | "pass"
  | "warning"
  | "fail"
  | "unknown"
  | "not_applicable";

export type CompatibilitySeverity = "info" | "warning" | "error" | "critical";

export type CompatibilityBody = {
  cpu_id?: number;
  motherboard_id?: number;
  gpu_id?: number;
  psu_id?: number;
  case_id?: number;
  cpu_cooler_id?: number;
  ram_id?: number;
  /** At most 4. */
  ram_ids?: number[];
  ssd_id?: number;
  /** At most 8. */
  ssd_ids?: number[];
};

export type CompatibilityCheck = {
  /** For example cpu.motherboard.socket */
  rule: string;
  status: CompatibilityStatus;
  severity: CompatibilitySeverity;
  /** Written for the user, safe to show. */
  message: string;
  evidence: {
    source_name: string | null;
    source_url: string | null;
    note: string | null;
  } | null;
  /** Which RAM kit or SSD this check is about. */
  subject: { type: "ram" | "ssd"; id: number | null } | null;
};

export type PowerRequirement = {
  tdp_watts_profiles: { cpu?: number; gpu?: number };
  /** Always 100. */
  base_system_watts: number;
  estimated_load_watts: number | null;
  recommended_psu_wattage: number | null;
};

/** Answer of POST /api/compatibility/check (inside { data }). */
export type CheckResult = {
  status: CompatibilityStatus;
  checks: CompatibilityCheck[];
  power_requirement: PowerRequirement | null;
};

/** Answer of POST /api/compatibility/check-build (inside { data }). */
export type BuildCheckResult = {
  status: CompatibilityStatus;
  rule_set_version: string;
  checks: CompatibilityCheck[];
  /** Only fail and warning checks. */
  issues: CompatibilityCheck[];
  /** Type keys, in builder order. A to-do list, not an error. */
  missing_components: ComponentType[];
  power_requirement: PowerRequirement | null;
};

/* -------------------------------------------------------------------------- */
/* Shared builds and my builds (sections 7 and 9)                             */
/* -------------------------------------------------------------------------- */

export type BuildItem = {
  type: ComponentType;
  quantity: number;
  /** The price when the part was added. */
  unit_price_snapshot: number | null;
  notes: string | null;
  /** Website page of this part. */
  path: string;
  /** Same as a list item. lowest_price is the LIVE price. */
  component: ListItem<Record<string, unknown>>;
};

export type BuildPricing = {
  currency: "USD";
  /** Partial total when unpriced_parts > 0. null when no part has a price. */
  total: number | null;
  priced_parts: number;
  unpriced_parts: number;
};

export type BuildPage = {
  name: string | null;
  slug: string;
  description: string | null;
  is_public: boolean;
  updated_at: string | null;
  /** Saved parts that are inactive or deleted: show a notice. */
  unavailable_parts: number;
  items: BuildItem[];
  pricing: BuildPricing;
  compatibility: BuildCheckResult;
  seo: Seo;
};

export type SaveBuildBody = {
  /** Max 100. */
  name?: string | null;
  /** Max 1000. */
  description?: string | null;
  /** Default false (private). */
  is_public?: boolean;
  /** Required on POST. On PATCH it REPLACES all parts. 1 to 18 rows. */
  parts?: {
    type: ComponentType;
    component_id: number;
    /** 1 to 8, default 1. */
    quantity?: number;
    /** Max 255. */
    notes?: string | null;
  }[];
};

export type MyBuild = {
  name: string | null;
  slug: string;
  description: string | null;
  is_public: boolean;
  /** /builds/{slug} when public, null when private. */
  public_path: string | null;
  /** Only in the list. */
  parts_count?: number;
  /** Only after create or update. */
  parts?: {
    type: ComponentType;
    component_id: number;
    quantity: number;
    notes: string | null;
  }[];
  created_at: string;
  updated_at: string;
};

/* -------------------------------------------------------------------------- */
/* Account (section 8)                                                        */
/* -------------------------------------------------------------------------- */

export type User = { id: number; name: string; email: string };

export type AuthResult = {
  user: User;
  /** Shown ONCE. The server cannot show it again. */
  token: string;
  token_type: "Bearer";
  /** About 30 days. */
  expires_at: string;
};
