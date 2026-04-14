"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

function countSummary(severities: Severity[]): string {
  const counts = { high: 0, moderate: 0, low: 0 };
  for (const s of severities) counts[s]++;
  const parts: string[] = [];
  if (counts.high) parts.push(`${counts.high} ${counts.high === 1 ? "alert" : "alerts"}`);
  if (counts.moderate) parts.push(`${counts.moderate} attention`);
  if (counts.low) parts.push(`${counts.low} healthy`);
  return parts.join(", ");
}

const STORAGE_KEY = "archestra.cost-health-meter.open";

export function CostHealthMeter() {
  const { data, isLoading, isError } = useCostHealth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setOpen(stored === "true");
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  if (isError) return null;

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
      </Card>
    );
  }

  const { score, dimensions } = data;
  const dimensionKeys = Object.keys(DIMENSION_LABELS) as DimensionKey[];
  const summary = countSummary(
    dimensionKeys.map((k) => dimensions[k].severity as Severity),
  );

  return (
    <Card>
      <Collapsible open={open} onOpenChange={handleOpenChange}>
        <CollapsibleTrigger
          aria-label={open ? "Collapse cost health details" : "Expand cost health details"}
          className="w-full"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3 min-w-0">
              <CardTitle>Cost Health</CardTitle>
              <span className="text-sm text-muted-foreground truncate">
                {summary}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold tabular-nums">
                {score}
              </span>
              <Badge className={cn(SEVERITY_BADGE[overallSeverity(score)])}>
                {overallLabel(score)}
              </Badge>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-2">
            {dimensionKeys.map((key) => {
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
