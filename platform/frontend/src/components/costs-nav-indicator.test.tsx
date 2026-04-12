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

describe("CostsNavIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when the hook has no data (loading or 403)", () => {
    mockUseCostHealth.mockReturnValue({ data: undefined });
    const { container } = render(<CostsNavIndicator />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when overall score is >= 50 and no dimension is high", () => {
    mockUseCostHealth.mockReturnValue({
      data: {
        score: 75,
        dimensions: {
          limits: dim("low"),
          optimizationRules: dim("moderate"),
          compression: dim("low"),
          toolHygiene: dim("low"),
        },
      },
    });
    const { container } = render(<CostsNavIndicator />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the dot when overall score is below 50 even with no high dimensions", () => {
    mockUseCostHealth.mockReturnValue({
      data: {
        score: 40,
        dimensions: {
          limits: dim("moderate"),
          optimizationRules: dim("moderate"),
          compression: dim("moderate"),
          toolHygiene: dim("moderate"),
        },
      },
    });
    const { getByLabelText } = render(<CostsNavIndicator />);
    expect(getByLabelText("Cost health needs attention")).toBeInTheDocument();
  });

  it("renders the dot when any dimension has high severity", () => {
    mockUseCostHealth.mockReturnValue({
      data: {
        score: 30,
        dimensions: {
          limits: dim("high"),
          optimizationRules: dim("low"),
          compression: dim("low"),
          toolHygiene: dim("low"),
        },
      },
    });
    const { getByLabelText } = render(<CostsNavIndicator />);
    expect(getByLabelText("Cost health needs attention")).toBeInTheDocument();
  });
});
