// components/catalog/price-history.tsx
// The "Price history" part of a component page: three numbers, a line chart
// and a table of the daily prices. A Server Component, so everything is in the
// HTML. The page wraps it in <Suspense>, so a slow answer does not block the
// rest of the page.
//
// The chart is a plain SVG. The maths is in lib/price-chart.ts.

import type { ReactNode } from "react";
import { formatDate } from "@/lib/format";
import { getPriceHistory } from "@/lib/get-price-history";
import { CHART, buildChart } from "@/lib/price-chart";
import type { Category } from "@/lib/site";
import type { PriceHistory } from "@/lib/types";

type Props = {
  category: Category;
  /** The slug of the part. */
  slug: string;
};

/* -------------------------------------------------------------------------- */
/* Small helpers                                                              */
/* -------------------------------------------------------------------------- */

// "2026-09-21" -> "Sep 21". UTC, so the day never depends on the server time
// zone. (We never read the current time here: with cacheComponents turned on
// that can break the build.)
const axisDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function formatAxisDate(iso: string): string {
  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? iso : axisDateFormatter.format(date);
}

// One formatter for many numbers (cheaper than making one per number).
function makeMoney(
  currency: string,
  digits: number,
): (value: number) => string {
  try {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });

    return (value) => formatter.format(value);
  } catch {
    // Not a valid currency code. The API only sends USD, but we stay safe.
    return (value) => `${value.toFixed(digits)} ${currency}`;
  }
}

const focusClass =
  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

/* -------------------------------------------------------------------------- */
/* The section                                                                */
/* -------------------------------------------------------------------------- */

export async function PriceHistorySection({ category, slug }: Props) {
  // null = the call failed. It never throws (see lib/get-price-history.ts).
  const history = await getPriceHistory(category, slug);

  return (
    // scroll-mt-20: the sticky header (h-16) must not cover the heading when
    // someone jumps to #price-history.
    <section
      id="price-history"
      aria-labelledby="price-history-heading"
      className="scroll-mt-20"
    >
      <h2
        id="price-history-heading"
        className="text-2xl font-semibold tracking-tight"
      >
        Price history
      </h2>

      {history === null ? (
        <Message>The price history is not available right now.</Message>
      ) : (
        <HistoryBody history={history} />
      )}
    </section>
  );
}

function Message({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-muted-foreground">{children}</p>;
}

function HistoryBody({ history }: { history: PriceHistory }) {
  // If the API did not send the list, we show the "no history" message
  // instead of crashing.
  const points = Array.isArray(history.points) ? history.points : [];
  const chart = buildChart(points);

  if (points.length === 0 || chart === null) {
    return <Message>We have no price history for this part yet.</Message>;
  }

  // One priced day cannot make a line.
  if (chart.dots.length < 2) {
    return (
      <Message>There is not enough price history to draw a chart yet.</Message>
    );
  }

  const money = makeMoney(history.currency, 2);
  const axisMoney = makeMoney(history.currency, chart.fractionDigits);
  const { summary } = history;

  const summaryText = [
    summary.latest !== null ? `latest ${money(summary.latest)}` : null,
    summary.lowest !== null ? `lowest ${money(summary.lowest)}` : null,
    summary.highest !== null ? `highest ${money(summary.highest)}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(", ");

  // The table shows the newest day first.
  const rows = [...points].reverse();

  return (
    <>
      <dl className="mt-4 grid max-w-3xl gap-3 sm:grid-cols-3">
        <Stat
          label="Latest price"
          value={
            summary.latest !== null ? money(summary.latest) : "Not in stock"
          }
        />
        <Stat
          label={`Lowest, last ${history.days} days`}
          value={summary.lowest !== null ? money(summary.lowest) : "Unknown"}
        />
        <Stat
          label={`Highest, last ${history.days} days`}
          value={summary.highest !== null ? money(summary.highest) : "Unknown"}
        />
      </dl>

      {/* The box scrolls sideways on small screens and can get keyboard focus,
          so people without a mouse can scroll it. */}
      <div
        role="region"
        aria-label="Price chart"
        tabIndex={0}
        className={`mt-4 max-w-3xl overflow-x-auto rounded-xl border bg-card p-3 ${focusClass}`}
      >
        <svg
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          role="img"
          aria-labelledby="price-chart-title price-chart-desc"
          className="block h-auto w-full min-w-[28rem]"
        >
          <title id="price-chart-title">
            Price history, last {history.days} days
          </title>
          <desc id="price-chart-desc">
            Lowest in-stock price per day.{" "}
            {summaryText !== "" ? `${summaryText}.` : ""}
          </desc>

          {/* Horizontal lines and the price labels. */}
          {chart.yTicks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={CHART.left}
                x2={CHART.width - CHART.right}
                y1={tick.y}
                y2={tick.y}
                className="stroke-border"
              />
              <text
                x={CHART.left - 8}
                y={tick.y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted-foreground text-xs"
              >
                {axisMoney(tick.value)}
              </text>
            </g>
          ))}

          {/* The date labels. */}
          {chart.xTicks.map((tick) => (
            <text
              key={tick.date}
              x={tick.x}
              y={CHART.height - 8}
              textAnchor={tick.anchor}
              className="fill-muted-foreground text-xs"
            >
              {formatAxisDate(tick.date)}
            </text>
          ))}

          {/* One line per run of days with a price. A gap has no line. */}
          {chart.lines.map((path) => (
            <path
              key={path}
              d={path}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              className="stroke-primary"
            />
          ))}

          {/* A day that stands alone is not part of a line, so it gets a dot. */}
          {chart.lonelyDots.map((dot) => (
            <circle
              key={dot.date}
              cx={dot.x}
              cy={dot.y}
              r={3}
              className="fill-primary"
            />
          ))}

          {/* Invisible, bigger circles. The mouse shows the <title> as a
              tooltip. (No JavaScript needed.) */}
          {chart.dots.map((dot) => (
            <circle
              key={dot.date}
              cx={dot.x}
              cy={dot.y}
              r={6}
              className="fill-transparent"
            >
              <title>{`${formatDate(dot.date) ?? dot.date}: ${money(dot.price)}`}</title>
            </circle>
          ))}
        </svg>
      </div>

      <p className="mt-3 max-w-3xl text-xs text-muted-foreground">
        The line shows the lowest in-stock price of each day. A gap means no
        shop had the part in stock that day. The live prices above can be
        different.
      </p>

      <details className="mt-4 max-w-3xl">
        <summary className="cursor-pointer text-sm font-medium">
          Show the daily prices ({points.length} days)
        </summary>

        <div
          role="region"
          aria-label="Daily prices"
          tabIndex={0}
          className={`mt-3 max-h-80 overflow-y-auto rounded-xl border bg-card ${focusClass}`}
        >
          <table className="w-full text-sm">
            <caption className="sr-only">
              Lowest in-stock price per day, newest first
            </caption>
            <thead className="sticky top-0 border-b bg-card">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-2 text-left font-medium text-muted-foreground"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-right font-medium text-muted-foreground"
                >
                  Lowest in-stock price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((point) => (
                <tr key={point.date}>
                  <th scope="row" className="px-4 py-2 text-left font-normal">
                    <time dateTime={point.date}>
                      {formatDate(point.date) ?? point.date}
                    </time>
                  </th>
                  <td className="px-4 py-2 text-right">
                    {point.lowest_price === null ? (
                      <span className="text-muted-foreground">
                        No in-stock price
                      </span>
                    ) : (
                      money(point.lowest_price)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}

// Grey pulsing boxes while the history loads.
export function PriceHistorySkeleton() {
  return (
    <div role="status" aria-label="Loading price history">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted/50" />
      <div className="mt-4 h-64 max-w-3xl animate-pulse rounded-xl border bg-muted/50" />
    </div>
  );
}
