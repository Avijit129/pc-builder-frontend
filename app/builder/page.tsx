import type { Metadata } from "next";
import { BuilderApp } from "@/components/builder/builder-app";

// The layout adds " | PC Builder" to this title.
export const metadata: Metadata = {
  title: "Build your PC",
  description:
    "Choose your CPU, motherboard, RAM, graphics card, storage, power supply and case, and see the price of your build.",
  alternates: { canonical: "/builder" },
};

// A Server Component. It only holds the title. The builder itself is a Client
// Component, because it needs state and mouse clicks.
export default function BuilderPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Build your PC</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Choose your parts one by one. We show the lowest in-stock price for each
        part.
      </p>

      <BuilderApp />
    </div>
  );
}
