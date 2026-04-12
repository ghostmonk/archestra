"use client";

import { useCostHealth } from "@/lib/statistics.query";

export function CostsNavIndicator() {
  const { data } = useCostHealth();

  if (!data) return null;

  const hasAlert =
    data.score < 50 ||
    Object.values(data.dimensions).some((d) => d.severity === "high");

  if (!hasAlert) return null;

  return (
    <span
      aria-label="Cost health needs attention"
      className="ml-auto inline-flex h-2 w-2 shrink-0 rounded-full bg-red-500"
    />
  );
}
