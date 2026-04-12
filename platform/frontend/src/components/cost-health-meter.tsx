"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCostHealth } from "@/lib/statistics.query";

type Severity = "low" | "moderate" | "high";

const SEVERITY_BADGE: Record<Severity, string> = {
  low: "bg-green-500/10 text-green-600 border border-green-500/30",
  moderate: "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20",
  high: "bg-red-500/10 text-red-600 border border-red-500/30",
};

const SEVERITY_LABEL: Record<Severity, string> = {
  low: "Healthy",
  moderate: "Attention",
  high: "Action needed",
};

const DIMENSION_LABELS = {
  limits: "Spending Limits",
  optimizationRules: "Optimization Rules",
  compression: "Response Compression",
  toolHygiene: "Tool Hygiene",
} as const;

type DimensionKey = keyof typeof DIMENSION_LABELS;

function overallLabel(score: number) {
  if (score >= 80) return "Healthy";
  if (score >= 50) return "Fair";
  return "Needs Attention";
}

function overallSeverity(score: number): Severity {
  if (score >= 80) return "low";
  if (score >= 50) return "moderate";
  return "high";
}

export function CostHealthMeter() {
  const { data, isLoading, isError } = useCostHealth();

  if (isError) return null;

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const { score, dimensions } = data;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Cost Health</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-semibold tabular-nums">{score}</span>
          <Badge className={cn(SEVERITY_BADGE[overallSeverity(score)])}>
            {overallLabel(score)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {(Object.keys(DIMENSION_LABELS) as DimensionKey[]).map((key) => {
          const d = dimensions[key];
          const severity = d.severity as Severity;
          return (
            <Link
              key={key}
              href={d.link}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-medium shrink-0">
                  {DIMENSION_LABELS[key]}
                </span>
                <Badge className={cn(SEVERITY_BADGE[severity])}>
                  {SEVERITY_LABEL[severity]}
                </Badge>
                <span className="text-sm text-muted-foreground truncate">
                  {d.message}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
