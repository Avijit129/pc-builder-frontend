// lib/price-chart.ts
// The maths of the price chart (no React). It turns the daily points of the
// API into the numbers an SVG needs: lines, dots and axis labels.
//
// The SVG has its own coordinate system (the "viewBox"): 560 wide and 240
// high. The browser scales it to the real size. Inside it, the "plot" is the
// area where the line is drawn. The margins hold the axis labels.

import type { PricePoint } from "@/lib/types";

export const CHART = {
  width: 560,
  height: 240,
  left: 64, // room for the price labels
  right: 16,
  top: 16,
  bottom: 32, // room for the date labels
} as const;

const PLOT_WIDTH = CHART.width - CHART.left - CHART.right;
const PLOT_HEIGHT = CHART.height - CHART.top - CHART.bottom;

/** How many price labels the y axis has. */
const Y_TICK_COUNT = 4;

export type ChartDot = {
  x: number;
  y: number;
  date: string;
  price: number;
};

export type ChartGeometry = {
  /** One "M x y L x y ..." text per run of days that have a price. */
  lines: string[];
  /** Every day that has a price. */
  dots: ChartDot[];
  /** Days with a price but no neighbor with a price: a line cannot show them. */
  lonelyDots: ChartDot[];
  yTicks: { y: number; value: number }[];
  xTicks: { x: number; date: string; anchor: "start" | "middle" | "end" }[];
  /** 0 for a big price range ($299), 2 for a small one ($9.99). */
  fractionDigits: number;
};

// 123.456 -> 123.5. Enough for the screen, and it keeps the SVG text short.
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function anchorFor(index: number, last: number): "start" | "middle" | "end" {
  if (last === 0) return "middle";
  if (index === 0) return "start";
  if (index === last) return "end";

  return "middle";
}

/**
 * Returns null when no day has a price (there is nothing to draw).
 * The points come from the API: oldest first, one per day. A null price is a
 * gap in the line, never 0.
 */
export function buildChart(points: PricePoint[]): ChartGeometry | null {
  let min = Infinity;
  let max = -Infinity;

  for (const point of points) {
    if (point.lowest_price === null) continue;

    min = Math.min(min, point.lowest_price);
    max = Math.max(max, point.lowest_price);
  }

  if (min === Infinity) return null;

  // A little space above and below the line, so it never touches the edge.
  // If every price is the same, the line would be flat on a zero range, so we
  // add a small fixed space.
  const spread = max - min;
  const pad = spread > 0 ? spread * 0.15 : Math.max(max * 0.05, 1);
  const low = Math.max(0, min - pad);
  const high = max + pad;

  const last = points.length - 1;

  const xAt = (index: number): number =>
    last === 0
      ? CHART.left + PLOT_WIDTH / 2
      : CHART.left + (index / last) * PLOT_WIDTH;

  // A higher price is higher on the screen, but y grows downward in SVG.
  const yAt = (price: number): number =>
    CHART.top + (1 - (price - low) / (high - low)) * PLOT_HEIGHT;

  // Split the days into "runs": days with a price that follow each other.
  // A day without a price ends the run, so the line has a gap there.
  const runs: ChartDot[][] = [];
  const dots: ChartDot[] = [];
  let current: ChartDot[] = [];

  for (const [index, point] of points.entries()) {
    if (point.lowest_price === null) {
      if (current.length > 0) {
        runs.push(current);
        current = [];
      }

      continue;
    }

    const dot: ChartDot = {
      x: round1(xAt(index)),
      y: round1(yAt(point.lowest_price)),
      date: point.date,
      price: point.lowest_price,
    };

    dots.push(dot);
    current.push(dot);
  }

  if (current.length > 0) runs.push(current);

  const lines: string[] = [];
  const lonelyDots: ChartDot[] = [];

  for (const run of runs) {
    if (run.length === 1) {
      lonelyDots.push(run[0]);
      continue;
    }

    lines.push(
      run
        .map((dot, index) => `${index === 0 ? "M" : "L"}${dot.x} ${dot.y}`)
        .join(" "),
    );
  }

  const yTicks = Array.from({ length: Y_TICK_COUNT }, (_, index) => {
    const value = low + ((high - low) * index) / (Y_TICK_COUNT - 1);

    return { y: round1(yAt(value)), value };
  });

  // The first, the middle and the last day.
  const tickIndexes =
    last === 0 ? [0] : last === 1 ? [0, 1] : [0, Math.round(last / 2), last];

  const xTicks = tickIndexes.map((index) => ({
    x: round1(xAt(index)),
    date: points[index].date,
    anchor: anchorFor(index, last),
  }));

  return {
    lines,
    dots,
    lonelyDots,
    yTicks,
    xTicks,
    fractionDigits: high - low >= 10 ? 0 : 2,
  };
}
