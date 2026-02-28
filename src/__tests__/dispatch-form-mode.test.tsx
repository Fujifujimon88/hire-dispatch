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

  // クライアント用: 種別（クライアント）フィールドを非表示
  it("hides client/type field when clientSlug is provided", () => {
    render(<DispatchForm {...baseProps} clientSlug="boj" />);
    expect(screen.queryByText("クライアント")).not.toBeInTheDocument();
    expect(screen.queryByText(/固定/)).not.toBeInTheDocument();
  });

  // クライアント用: メール通知設定セクションを非表示
  it("hides email notification section when clientSlug is provided", () => {
    render(<DispatchForm {...baseProps} clientSlug="boj" />);
    expect(screen.queryByText("メール通知設定")).not.toBeInTheDocument();
    expect(screen.queryByText(/社内通知先/)).not.toBeInTheDocument();
    expect(screen.queryByText(/顧客通知先/)).not.toBeInTheDocument();
  });

  // 社内用: 種別フィールドを表示
  it("shows client/type field when no clientSlug (internal)", () => {
    render(<DispatchForm {...baseProps} />);
    expect(screen.getByText("クライアント")).toBeInTheDocument();
  });

  // 社内用: メール通知設定を表示
  it("shows email notification section when no clientSlug (internal)", () => {
    render(<DispatchForm {...baseProps} />);
    expect(screen.getByText("メール通知設定")).toBeInTheDocument();
  });

  // 両方: 車両番号・ドライバー・携帯を非表示
  it("hides driverInfo field in both modes", () => {
    const { unmount } = render(<DispatchForm {...baseProps} clientSlug="boj" />);
    expect(screen.queryByText("車両番号・ドライバー・携帯")).not.toBeInTheDocument();
    unmount();

    render(<DispatchForm {...baseProps} />);
    expect(screen.queryByText("車両番号・ドライバー・携帯")).not.toBeInTheDocument();
  });

  // 両方: 金額フィールドを表示
  it("shows price field in both modes", () => {
    const { unmount } = render(<DispatchForm {...baseProps} clientSlug="boj" />);
    expect(screen.getByText("金額（税込）")).toBeInTheDocument();
    unmount();

    render(<DispatchForm {...baseProps} />);
    expect(screen.getByText("金額（税込）")).toBeInTheDocument();
  });
});
