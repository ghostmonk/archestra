import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CostsNavIndicator } from "./costs-nav-indicator";

const mockUseCostHealth = vi.fn();

vi.mock("@/lib/statistics.query", () => ({
  useCostHealth: () => mockUseCostHealth(),
}));

type Severity = "low" | "moderate" | "high";

function dim(severity: Severity) {
  return { score: 0, severity, message: "", link: "/" };
}

function mockHealth(score: number) {
  mockUseCostHealth.mockReturnValue({
    data: {
      score,
      dimensions: {
        limits: dim("low"),
        optimizationRules: dim("low"),
        compression: dim("low"),
        toolHygiene: dim("low"),
      },
    },
  });
}

describe("CostsNavIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when the hook has no data (loading or 403)", () => {
    mockUseCostHealth.mockReturnValue({ data: undefined });
    const { container } = render(<CostsNavIndicator />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when overall score is healthy (>= 80)", () => {
    mockHealth(85);
    const { container } = render(<CostsNavIndicator />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a yellow dot when overall score is fair (50-79)", () => {
    mockHealth(60);
    const { getByLabelText } = render(<CostsNavIndicator />);
    const dot = getByLabelText("Cost health could improve");
    expect(dot).toBeInTheDocument();
    expect(dot.className).toContain("bg-yellow-500");
  });

  it("renders a red dot when overall score needs attention (< 50)", () => {
    mockHealth(30);
    const { getByLabelText } = render(<CostsNavIndicator />);
    const dot = getByLabelText("Cost health needs attention");
    expect(dot).toBeInTheDocument();
    expect(dot.className).toContain("bg-red-500");
  });
});
