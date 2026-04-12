import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CostHealthMeter } from "./cost-health-meter";

const mockUseCostHealth = vi.fn();

vi.mock("@/lib/statistics.query", () => ({
  useCostHealth: () => mockUseCostHealth(),
}));

function makeDimension(overrides: Partial<Dimension> = {}): Dimension {
  return {
    score: 100,
    severity: "low",
    message: "All good",
    link: "/llm/limits",
    ...overrides,
  };
}

type Dimension = {
  score: number;
  severity: "low" | "moderate" | "high";
  message: string;
  link: string;
};

function makeHealthData(score: number, dimensions?: Record<string, Dimension>) {
  return {
    score,
    dimensions: {
      limits: makeDimension({ link: "/llm/limits" }),
      optimizationRules: makeDimension({ link: "/llm/optimization-rules" }),
      compression: makeDimension({ link: "/settings/llm" }),
      toolHygiene: makeDimension({ link: "/agents" }),
      ...dimensions,
    },
  };
}

describe("CostHealthMeter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when the query errors (e.g. 403 for non-admins)", () => {
    mockUseCostHealth.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    const { container } = render(<CostHealthMeter />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a loading skeleton before data arrives", () => {
    mockUseCostHealth.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    render(<CostHealthMeter />);
    expect(screen.queryByText("Cost Health")).not.toBeInTheDocument();
  });

  it("shows overall score with 'Healthy' label when score >= 80", () => {
    mockUseCostHealth.mockReturnValue({
      data: makeHealthData(85),
      isLoading: false,
      isError: false,
    });
    render(<CostHealthMeter />);
    expect(screen.getByText("85")).toBeInTheDocument();
    // "Healthy" appears on the overall badge plus each low-severity dimension.
    expect(screen.getAllByText("Healthy").length).toBeGreaterThanOrEqual(1);
  });

  it("shows 'Fair' label for scores between 50 and 79", () => {
    mockUseCostHealth.mockReturnValue({
      data: makeHealthData(60),
      isLoading: false,
      isError: false,
    });
    render(<CostHealthMeter />);
    expect(screen.getByText("Fair")).toBeInTheDocument();
  });

  it("shows 'Needs Attention' label for scores below 50", () => {
    mockUseCostHealth.mockReturnValue({
      data: makeHealthData(25),
      isLoading: false,
      isError: false,
    });
    render(<CostHealthMeter />);
    expect(screen.getByText("Needs Attention")).toBeInTheDocument();
  });

  it("renders all four dimension rows with their links", () => {
    mockUseCostHealth.mockReturnValue({
      data: makeHealthData(100),
      isLoading: false,
      isError: false,
    });
    render(<CostHealthMeter />);

    expect(screen.getByText("Spending Limits")).toBeInTheDocument();
    expect(screen.getByText("Optimization Rules")).toBeInTheDocument();
    expect(screen.getByText("Response Compression")).toBeInTheDocument();
    expect(screen.getByText("Tool Hygiene")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Spending Limits/ })).toHaveAttribute(
      "href",
      "/llm/limits",
    );
    expect(
      screen.getByRole("link", { name: /Optimization Rules/ }),
    ).toHaveAttribute("href", "/llm/optimization-rules");
    expect(
      screen.getByRole("link", { name: /Response Compression/ }),
    ).toHaveAttribute("href", "/settings/llm");
    expect(screen.getByRole("link", { name: /Tool Hygiene/ })).toHaveAttribute(
      "href",
      "/agents",
    );
  });

  it("maps dimension severity to user-visible labels", () => {
    mockUseCostHealth.mockReturnValue({
      data: makeHealthData(50, {
        limits: makeDimension({ severity: "high", link: "/llm/limits" }),
        optimizationRules: makeDimension({
          severity: "moderate",
          link: "/llm/optimization-rules",
        }),
        compression: makeDimension({
          severity: "low",
          link: "/settings/llm",
        }),
        toolHygiene: makeDimension({ severity: "low", link: "/agents" }),
      }),
      isLoading: false,
      isError: false,
    });
    render(<CostHealthMeter />);

    expect(screen.getByText("Action needed")).toBeInTheDocument();
    expect(screen.getByText("Attention")).toBeInTheDocument();
    // "Healthy" appears for both low-severity dimensions and the overall label.
    expect(screen.getAllByText("Healthy").length).toBeGreaterThanOrEqual(2);
  });

  it("renders dimension messages from the API", () => {
    mockUseCostHealth.mockReturnValue({
      data: makeHealthData(50, {
        limits: makeDimension({
          severity: "high",
          message: "No spending limits configured",
          link: "/llm/limits",
        }),
      }),
      isLoading: false,
      isError: false,
    });
    render(<CostHealthMeter />);
    expect(
      screen.getByText("No spending limits configured"),
    ).toBeInTheDocument();
  });
});
