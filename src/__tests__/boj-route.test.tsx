import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DispatchApp } from "@/components/DispatchApp";

// Mock child components to isolate DispatchApp tests
vi.mock("@/components/DispatchForm", () => ({
  DispatchForm: (props: Record<string, unknown>) => (
    <div data-testid="dispatch-form" data-client-slug={props.clientSlug || ""} />
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

describe("DispatchApp clientSlug prop", () => {
  it('shows "手配書管理" header when no clientSlug (internal view)', () => {
    render(<DispatchApp />);
    expect(screen.getByText("手配書管理")).toBeInTheDocument();
  });

  it('shows client name in header when clientSlug is provided', () => {
    render(<DispatchApp clientSlug="boj" clientName="BOJ様" />);
    expect(screen.getByText("BOJ様 発注依頼")).toBeInTheDocument();
  });

  it("defaults to internal mode when clientSlug is not specified", () => {
    render(<DispatchApp />);
    expect(screen.getByText("DISPATCH MANAGEMENT")).toBeInTheDocument();
  });

  it("passes clientSlug to DispatchForm", () => {
    render(<DispatchApp clientSlug="boj" clientName="BOJ様" />);
    const form = screen.getByTestId("dispatch-form");
    expect(form).toHaveAttribute("data-client-slug", "boj");
  });

  it("passes empty clientSlug to DispatchForm in internal mode", () => {
    render(<DispatchApp />);
    const form = screen.getByTestId("dispatch-form");
    expect(form).toHaveAttribute("data-client-slug", "");
  });
});
