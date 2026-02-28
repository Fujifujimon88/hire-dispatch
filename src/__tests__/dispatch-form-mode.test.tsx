import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DispatchForm } from "@/components/DispatchForm";

// Mock fetch to return empty clients list
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  ));
});

describe("DispatchForm clientSlug prop", () => {
  const baseProps = {
    vehicles: [],
    editItem: null,
    onSaved: vi.fn(),
    onCancel: vi.fn(),
  };

  it('shows "確定案件 - 新規発注依頼" title when clientSlug is provided', () => {
    render(<DispatchForm {...baseProps} clientSlug="boj" />);
    expect(screen.getByText("確定案件 - 新規発注依頼")).toBeInTheDocument();
  });

  it('shows "確定案件 - 新規手配書" title when no clientSlug (internal)', () => {
    render(<DispatchForm {...baseProps} />);
    expect(screen.getByText("確定案件 - 新規手配書")).toBeInTheDocument();
  });

  it("shows fixed client label when clientSlug is provided", () => {
    render(<DispatchForm {...baseProps} clientSlug="boj" />);
    const fixedLabel = screen.queryByText(/固定/);
    expect(fixedLabel).toBeInTheDocument();
  });
});
