import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DispatchApp } from "@/components/DispatchApp";

// Mock child components to isolate DispatchApp tests
vi.mock("@/components/DispatchForm", () => ({
  DispatchForm: (props: Record<string, unknown>) => (
    <div data-testid="dispatch-form" data-mode={props.mode} />
  ),
}));
vi.mock("@/components/DispatchTable", () => ({
  DispatchTable: () => <div data-testid="dispatch-table" />,
}));
vi.mock("@/components/ConsultationForm", () => ({
  ConsultationForm: () => <div data-testid="consultation-form" />,
}));
vi.mock("@/components/ConsultationTable", () => ({
  ConsultationTable: () => <div data-testid="consultation-table" />,
}));

// Mock fetch for data loading
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  ));
});

describe("DispatchApp mode prop", () => {
  it('shows "手配書管理" header in internal mode', () => {
    render(<DispatchApp mode="internal" />);
    expect(screen.getByText("手配書管理")).toBeInTheDocument();
  });

  it('shows "BOJ 発注依頼" header in boj mode', () => {
    render(<DispatchApp mode="boj" />);
    expect(screen.getByText("BOJ 発注依頼")).toBeInTheDocument();
  });

  it("defaults to internal mode when mode is not specified", () => {
    render(<DispatchApp />);
    expect(screen.getByText("手配書管理")).toBeInTheDocument();
  });

  it("passes mode to DispatchForm", () => {
    render(<DispatchApp mode="boj" />);
    const form = screen.getByTestId("dispatch-form");
    expect(form).toHaveAttribute("data-mode", "boj");
  });
});
