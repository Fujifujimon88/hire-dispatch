import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientManagement } from "@/components/ClientManagement";

// Mock fetch
const mockFetch = vi.fn();
beforeEach(() => {
  cleanup();
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

describe("ClientManagement", () => {
  it("renders client list from API", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: "c1", slug: "boj", name: "BOJ様", isActive: true, mappingType: "BOJ" },
          { id: "c2", slug: "test", name: "テスト社", isActive: true, mappingType: "OTHER" },
        ]),
    });

    render(<ClientManagement />);

    await waitFor(() => {
      expect(screen.getByText("BOJ様")).toBeInTheDocument();
      expect(screen.getByText("テスト社")).toBeInTheDocument();
    });
  });

  it("shows add form and submits new client", async () => {
    const user = userEvent.setup();

    // Initial load returns empty
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<ClientManagement />);

    // Wait for initial load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/dispatch-clients");
    });

    // Fill out slug and name fields
    const slugInput = screen.getByPlaceholderText("boj");
    const nameInput = screen.getByPlaceholderText("BOJ様");
    await user.type(slugInput, "new-client");
    await user.type(nameInput, "新規クライアント");

    // Mock POST response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "c3",
          slug: "new-client",
          name: "新規クライアント",
          isActive: true,
        }),
    });
    // Mock reload after POST
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: "c3", slug: "new-client", name: "新規クライアント", isActive: true, mappingType: "OTHER" },
        ]),
    });

    const addButton = screen.getByRole("button", { name: "追加" });
    await user.click(addButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/dispatch-clients",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("new-client"),
        })
      );
    });
  });

  it("displays slug as a clickable link", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: "c1", slug: "boj", name: "BOJ様", isActive: true, mappingType: "BOJ" },
        ]),
    });

    render(<ClientManagement />);

    await waitFor(() => {
      const link = screen.getByRole("link", { name: "/boj" });
      expect(link).toHaveAttribute("href", "/boj");
    });
  });

  it("shows delete confirmation and calls API", async () => {
    const user = userEvent.setup();
    // Mock window.confirm
    vi.spyOn(window, "confirm").mockReturnValue(true);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: "c1", slug: "boj", name: "BOJ様", isActive: true, mappingType: "BOJ" },
        ]),
    });

    render(<ClientManagement />);

    await waitFor(() => {
      expect(screen.getByText("BOJ様")).toBeInTheDocument();
    });

    // Mock DELETE response
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    // Mock reload
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

    const deleteButton = screen.getByRole("button", { name: "削除" });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/dispatch-clients/c1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });
});
