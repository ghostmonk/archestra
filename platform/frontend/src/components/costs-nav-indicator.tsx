"use client";

import { useCostHealth } from "@/lib/statistics.query";

export function CostsNavIndicator() {
  const { data } = useCostHealth();

  if (!data) return null;

  if (data.score >= 80) return null;

  const isHigh = data.score < 50;

  return (
    <span
      aria-label={
        isHigh ? "Cost health needs attention" : "Cost health could improve"
      }
      className={`ml-auto inline-flex h-2 w-2 shrink-0 rounded-full ${
        isHigh ? "bg-red-500" : "bg-yellow-500"
      }`}
    />
  );
}
