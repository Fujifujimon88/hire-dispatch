import { describe, it, expect, vi, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Mock DispatchApp to capture props
vi.mock("@/components/DispatchApp", () => ({
  DispatchApp: (props: Record<string, unknown>) => {
    return <div data-testid="dispatch-app" data-mode={props.mode} />;
  },
}));

beforeEach(() => {
  cleanup();
});

describe("BOJ page (src/app/boj/page.tsx)", () => {
  it('renders DispatchApp with mode="boj"', async () => {
    const { default: BOJPage } = await import("@/app/boj/page");
    const { render, screen } = await import("@testing-library/react");
    render(<BOJPage />);
    const app = screen.getByTestId("dispatch-app");
    expect(app).toHaveAttribute("data-mode", "boj");
  });
});

describe("Dispatch page (src/app/dispatch/page.tsx)", () => {
  it('renders DispatchApp with mode="internal"', async () => {
    cleanup();
    const { default: DispatchPage } = await import("@/app/dispatch/page");
    const { render, screen } = await import("@testing-library/react");
    render(<DispatchPage />);
    const app = screen.getByTestId("dispatch-app");
    expect(app).toHaveAttribute("data-mode", "internal");
  });
});
