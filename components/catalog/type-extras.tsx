// components/catalog/type-extras.tsx
// The extra tables that only some component types have (step B4):
//   cpu / gpu  -> Benchmarks
//   psu        -> Cables
//   pc_case    -> Fan and radiator mounts
// Every table is hidden when its list is empty. null is shown as "Unknown".
// It is a Server Component, so the data is in the HTML for search engines.

import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { formatDate, formatNumber, humanize } from "@/lib/format";
import type { Category } from "@/lib/site";
import type {
  CaseFanMount,
  ComponentDetail,
  CpuBenchmark,
  CpuDetail,
  GpuBenchmark,
  GpuDetail,
  PcCaseDetail,
  PsuCable,
  PsuDetail,
} from "@/lib/types";

type Props = {
  category: Category;
  component: ComponentDetail;
};

/* -------------------------------------------------------------------------- */
/* Small helpers                                                              */
/* -------------------------------------------------------------------------- */

// If the API did not send the list, we show nothing instead of crashing.
function asList<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

// Only normal web links become clickable. "javascript:..." never does.
function safeHttpUrl(url: string | null | undefined): string | null {
  return typeof url === "string" && /^https?:\/\//i.test(url.trim())
    ? url.trim()
    : null;
}

function Unknown() {
  return <span className="text-muted-foreground">Unknown</span>;
}

/** A number with an optional unit, or "Unknown". */
function Measured({
  value,
  suffix = "",
}: {
  value: number | null | undefined;
  suffix?: string;
}) {
  return typeof value === "number" ? (
    <>
      {formatNumber(value)}
      {suffix}
    </>
  ) : (
    <Unknown />
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th
      scope="col"
      className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground"
    >
      {children}
    </th>
  );
}

const rowHeaderClass = "px-4 py-3 text-left align-top font-normal";
const cellClass = "px-4 py-3 align-top";

/**
 * The frame every table shares: a heading and a box that scrolls sideways on
 * small screens. The box can get keyboard focus, so people without a mouse
 * can scroll it too.
 */
function TableSection({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-2xl font-semibold tracking-tight">
        {title}
      </h2>

      {intro && (
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{intro}</p>
      )}

      <div
        role="region"
        aria-labelledby={id}
        tabIndex={0}
        className="mt-6 overflow-x-auto rounded-xl border bg-card focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <table className="w-full min-w-[40rem] text-sm">{children}</table>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Benchmarks (CPU and GPU)                                                   */
/* -------------------------------------------------------------------------- */

type ResultLine = { label: string; value: string };

// CPU and GPU benchmarks have different fields. We turn both into this one
// shape, so ONE table component can show them.
type BenchmarkRow = {
  name: string;
  version: string | null;
  testType: string | null;
  /** Small grey text under the name, for example "1920x1080 · Ultra". */
  details: string;
  lines: ResultLine[];
  sourceName: string | null;
  sourceUrl: string | null;
  testedAt: string | null;
};

// Keeps only the results that have a value.
function pickLines(entries: [string, string | null][]): ResultLine[] {
  return entries.flatMap(([label, value]) =>
    value === null ? [] : [{ label, value }],
  );
}

function withUnit(
  value: number | null | undefined,
  unit: string | null | undefined,
): string | null {
  if (typeof value !== "number") return null;

  const text = formatNumber(value);
  const cleanUnit = unit?.trim();

  return cleanUnit ? `${text} ${cleanUnit}` : text;
}

function fps(value: number | null | undefined): string | null {
  return typeof value === "number" ? `${formatNumber(value)} FPS` : null;
}

function cpuRow(benchmark: CpuBenchmark): BenchmarkRow {
  return {
    name: benchmark.name,
    version: benchmark.version,
    testType: benchmark.test_type,
    details: "",
    lines: pickLines([
      ["Score", withUnit(benchmark.score, benchmark.unit)],
      ["Single-core", withUnit(benchmark.single_core_score, benchmark.unit)],
      ["Multi-core", withUnit(benchmark.multi_core_score, benchmark.unit)],
    ]),
    sourceName: benchmark.source_name,
    sourceUrl: benchmark.source_url,
    testedAt: benchmark.tested_at,
  };
}

function gpuRow(benchmark: GpuBenchmark): BenchmarkRow {
  const settings = [benchmark.resolution, benchmark.quality_preset].filter(
    (value): value is string =>
      typeof value === "string" && value.trim() !== "",
  );

  // null means "unknown", so only a real true or false is shown.
  if (benchmark.ray_tracing_enabled === true) settings.push("Ray tracing on");
  if (benchmark.ray_tracing_enabled === false) settings.push("Ray tracing off");

  return {
    name: benchmark.name,
    version: benchmark.version,
    testType: benchmark.test_type,
    details: settings.join(" · "),
    lines: pickLines([
      ["Average", fps(benchmark.avg_fps)],
      ["1% low", fps(benchmark.one_percent_low_fps)],
      ["Score", withUnit(benchmark.score, benchmark.unit)],
    ]),
    sourceName: benchmark.source_name,
    sourceUrl: benchmark.source_url,
    testedAt: benchmark.tested_at,
  };
}

function SourceCell({
  name,
  url,
}: {
  name: string | null;
  url: string | null;
}) {
  const href = safeHttpUrl(url);
  const label = name && name.trim() !== "" ? name.trim() : null;

  if (href === null) {
    return label ? <>{label}</> : <Unknown />;
  }

  return (
    // "nofollow": we do not vouch for the other site. "noopener" protects us.
    <a
      href={href}
      target="_blank"
      rel="nofollow noopener"
      className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground"
    >
      {label ?? "Source"}
      <ExternalLink className="size-3.5" aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

function BenchmarkSection({ rows }: { rows: BenchmarkRow[] }) {
  if (rows.length === 0) return null;

  return (
    <TableSection id="benchmarks-heading" title="Benchmarks">
      <thead className="border-b">
        <tr>
          <Th>Test</Th>
          <Th>Result</Th>
          <Th>Source</Th>
          <Th>Tested</Th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((row, index) => {
          const tested = formatDate(row.testedAt);

          return (
            // The API sends no id for a benchmark, so the key uses the position.
            // This is fine: the list never changes after it is rendered.
            <tr key={`${index}-${row.name}`}>
              <th scope="row" className={rowHeaderClass}>
                <p className="font-medium">
                  {row.version ? `${row.name} ${row.version}` : row.name}
                </p>
                {row.testType && (
                  <p className="text-xs text-muted-foreground">
                    {humanize(row.testType)}
                  </p>
                )}
                {row.details !== "" && (
                  <p className="text-xs text-muted-foreground">{row.details}</p>
                )}
              </th>

              <td className={cellClass}>
                {row.lines.length === 0 ? (
                  <Unknown />
                ) : (
                  <ul className="space-y-0.5">
                    {row.lines.map((line) => (
                      <li key={line.label}>
                        <span className="text-muted-foreground">
                          {line.label}:{" "}
                        </span>
                        <span className="font-medium">{line.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </td>

              <td className={cellClass}>
                <SourceCell name={row.sourceName} url={row.sourceUrl} />
              </td>

              <td className={cellClass}>
                {tested && row.testedAt ? (
                  <time dateTime={row.testedAt}>{tested}</time>
                ) : (
                  <Unknown />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </TableSection>
  );
}

/* -------------------------------------------------------------------------- */
/* PSU cables                                                                 */
/* -------------------------------------------------------------------------- */

// The categories come from the psu_cable_types table in Laravel.
// An unknown new category still shows, with a plain label.
const CABLE_CATEGORY_LABELS: Record<string, string> = {
  motherboard_power: "Motherboard power",
  cpu_power: "CPU power",
  gpu_power: "GPU power",
  storage_power: "Storage power",
  extension: "Extension",
};

function cableCategory(category: string | null): string | null {
  if (category === null || category.trim() === "") return null;

  return Object.hasOwn(CABLE_CATEGORY_LABELS, category)
    ? CABLE_CATEGORY_LABELS[category]
    : humanize(category);
}

function CableSection({ cables }: { cables: PsuCable[] }) {
  if (cables.length === 0) return null;

  return (
    <TableSection id="cables-heading" title="Cables">
      <thead className="border-b">
        <tr>
          <Th>Cable</Th>
          <Th>Category</Th>
          <Th>Quantity</Th>
          <Th>Length</Th>
          <Th>Details</Th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {cables.map((cable, index) => {
          const category = cableCategory(cable.category);
          const color = cable.color?.trim();

          const details = [
            cable.is_modular ? "Modular" : "Non-modular",
            cable.is_sleeved ? "Sleeved" : "Not sleeved",
            ...(color ? [humanize(color)] : []),
          ];

          return (
            <tr key={`${index}-${cable.code ?? cable.type ?? "cable"}`}>
              <th scope="row" className={rowHeaderClass}>
                <p className="font-medium">{cable.type ?? "Unknown cable"}</p>
                {typeof cable.pin_count === "number" && (
                  <p className="text-xs text-muted-foreground">
                    {cable.pin_count}-pin
                  </p>
                )}
              </th>

              <td className={cellClass}>{category ?? <Unknown />}</td>

              <td className={cellClass}>
                <Measured value={cable.quantity} />
                {typeof cable.connectors_per_cable === "number" && (
                  <p className="text-xs text-muted-foreground">
                    {cable.connectors_per_cable}{" "}
                    {cable.connectors_per_cable === 1
                      ? "connector"
                      : "connectors"}{" "}
                    per cable
                  </p>
                )}
              </td>

              <td className={cellClass}>
                <Measured value={cable.cable_length_mm} suffix=" mm" />
              </td>

              <td className={cellClass}>{details.join(" · ")}</td>
            </tr>
          );
        })}
      </tbody>
    </TableSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Case fan mounts                                                            */
/* -------------------------------------------------------------------------- */

function FanMountSection({ mounts }: { mounts: CaseFanMount[] }) {
  if (mounts.length === 0) return null;

  return (
    <TableSection
      id="fan-mounts-heading"
      title="Fan and radiator mounts"
      intro="Radiators mount in place of fans at the same position."
    >
      <thead className="border-b">
        <tr>
          <Th>Position</Th>
          <Th>Fan size</Th>
          <Th>Max fans</Th>
          <Th>Included fans</Th>
          <Th>Max radiator</Th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {mounts.map((mount, index) => (
          <tr key={`${index}-${mount.position}-${mount.fan_size_mm}`}>
            <th scope="row" className={rowHeaderClass}>
              {humanize(mount.position)}
            </th>
            <td className={cellClass}>
              <Measured value={mount.fan_size_mm} suffix=" mm" />
            </td>
            <td className={cellClass}>
              <Measured value={mount.max_fan_count} />
            </td>
            <td className={cellClass}>
              <Measured value={mount.included_fan_count} />
            </td>
            <td className={cellClass}>
              <Measured value={mount.max_radiator_size_mm} suffix=" mm" />
            </td>
          </tr>
        ))}
      </tbody>
    </TableSection>
  );
}

/* -------------------------------------------------------------------------- */
/* The one component the page uses                                            */
/* -------------------------------------------------------------------------- */

// getComponent returns the base ComponentDetail type. After checking
// category.type we know which extra fields the API sent (docs/frontend-api.md,
// section 4), so the casts below are safe. asList protects us if a list is
// missing at runtime.
export function TypeExtras({ category, component }: Props) {
  switch (category.type) {
    case "cpu": {
      const cpu = component as CpuDetail;
      return <BenchmarkSection rows={asList(cpu.benchmarks).map(cpuRow)} />;
    }
    case "gpu": {
      const gpu = component as GpuDetail;
      return <BenchmarkSection rows={asList(gpu.benchmarks).map(gpuRow)} />;
    }
    case "psu": {
      const psu = component as PsuDetail;
      return <CableSection cables={asList(psu.cables)} />;
    }
    case "pc_case": {
      const pcCase = component as PcCaseDetail;
      return <FanMountSection mounts={asList(pcCase.fan_mounts)} />;
    }
    default:
      return null;
  }
}
