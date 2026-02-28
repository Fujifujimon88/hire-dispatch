import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
const mockFindMany = vi.fn();
const mockCreate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dispatchClient: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

describe("dispatch-clients API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns active clients sorted by name", async () => {
    const clients = [
      { id: "1", slug: "boj", name: "BOJ様", isActive: true },
      { id: "2", slug: "test", name: "テスト社", isActive: true },
    ];
    mockFindMany.mockResolvedValue(clients);

    const { GET } = await import("@/app/api/dispatch-clients/route");
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].slug).toBe("boj");
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
        orderBy: { name: "asc" },
      })
    );
  });

  it("POST creates a new client with slug and name", async () => {
    const newClient = { id: "3", slug: "new-corp", name: "新会社", isActive: true };
    mockCreate.mockResolvedValue(newClient);

    const { POST } = await import("@/app/api/dispatch-clients/route");
    const req = new Request("http://localhost/api/dispatch-clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "new-corp", name: "新会社" }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.slug).toBe("new-corp");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: "new-corp", name: "新会社" }),
      })
    );
  });

  it("POST returns 400 when slug is missing", async () => {
    const { POST } = await import("@/app/api/dispatch-clients/route");
    const req = new Request("http://localhost/api/dispatch-clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "名前だけ" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});
