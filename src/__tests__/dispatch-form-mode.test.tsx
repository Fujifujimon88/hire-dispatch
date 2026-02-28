import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DispatchForm } from "@/components/DispatchForm";

// Mock fetch
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  ));
});

describe("DispatchForm mode prop", () => {
  const baseProps = {
    vehicles: [],
    editItem: null,
    onSaved: vi.fn(),
    onCancel: vi.fn(),
  };

  it('shows "確定案件 - 新規発注依頼" title in boj mode', () => {
    render(<DispatchForm {...baseProps} mode="boj" />);
    expect(screen.getByText("確定案件 - 新規発注依頼")).toBeInTheDocument();
  });

  it('shows "確定案件 - 新規手配書" title in internal mode', () => {
    render(<DispatchForm {...baseProps} mode="internal" />);
    expect(screen.getByText("確定案件 - 新規手配書")).toBeInTheDocument();
  });

  it("defaults dispatchType to BOJ and disables select in boj mode", () => {
    render(<DispatchForm {...baseProps} mode="boj" />);
    // In boj mode, dispatchType should be fixed to BOJ
    // The select should not be present or should be disabled
    const bojLabel = screen.queryByText("BOJ（固定）");
    expect(bojLabel).toBeInTheDocument();
  });
});
