import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockLogCreate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dispatch: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    dispatchClient: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    dispatchLog: {
      create: (...args: unknown[]) => mockLogCreate(...args),
    },
  },
}));

vi.mock("@/lib/utils", () => ({
  generateDispatchOrderNumber: () => "JP26-TEST",
  cn: (...args: unknown[]) => args.join(" "),
}));

describe("dispatches API tenant filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
    mockLogCreate.mockResolvedValue({});
  });

  describe("GET", () => {
    it("filters by clientSlug when provided", async () => {
      mockFindUnique.mockResolvedValue({ id: "client-boj", slug: "boj" });
      mockFindMany.mockResolvedValue([{ id: "d1", clientId: "client-boj" }]);

      const { GET } = await import("@/app/api/dispatches/route");
      const req = new Request("http://localhost/api/dispatches?clientSlug=boj");
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: "boj" } })
      );
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ clientId: "client-boj" }),
        })
      );
    });

    it("returns all dispatches when clientSlug is not provided", async () => {
      mockFindMany.mockResolvedValue([{ id: "d1" }, { id: "d2" }]);

      const { GET } = await import("@/app/api/dispatches/route");
      const req = new Request("http://localhost/api/dispatches");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(mockFindUnique).not.toHaveBeenCalled();
    });
  });

  describe("POST", () => {
    it("auto-assigns clientId when clientSlug is provided", async () => {
      mockFindUnique.mockResolvedValue({ id: "client-boj", slug: "boj", code: "BOJ" });
      const mockDispatch = {
        id: "new-d1",
        clientId: "client-boj",
        orderNumber: "JP26-TEST",
        toJSON: function() { return this; },
      };
      mockCreate.mockResolvedValue(mockDispatch);

      const { POST } = await import("@/app/api/dispatches/route");
      const req = new Request("http://localhost/api/dispatches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: "JP26-001",
          personInCharge: "田中",
          arrangementDate: "2026-03-01",
          pickupLocation: "東京駅",
          pickupTime: "09:00",
          dropoffLocation: "成田空港",
          customerName: "テスト客",
          clientSlug: "boj",
        }),
      });
      const res = await POST(req);

      expect(res.status).toBe(201);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ clientId: "client-boj" }),
        })
      );
    });

    it("sets clientId to null when clientSlug is not provided", async () => {
      const mockDispatch = {
        id: "new-d2",
        clientId: null,
        orderNumber: "JP26-TEST",
        toJSON: function() { return this; },
      };
      mockCreate.mockResolvedValue(mockDispatch);

      const { POST } = await import("@/app/api/dispatches/route");
      const req = new Request("http://localhost/api/dispatches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: "JP26-002",
          personInCharge: "鈴木",
          arrangementDate: "2026-03-02",
          pickupLocation: "品川",
          pickupTime: "10:00",
          dropoffLocation: "羽田空港",
          customerName: "テスト客2",
        }),
      });
      const res = await POST(req);

      expect(res.status).toBe(201);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ clientId: null }),
        })
      );
    });
  });
});
