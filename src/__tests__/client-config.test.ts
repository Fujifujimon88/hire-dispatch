import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
const mockFindUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dispatchClient: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

// Set env defaults before importing
vi.stubEnv("GOOGLE_CALENDAR_IDS", "cal-default-1,cal-default-2");
vi.stubEnv("GOOGLE_SPREADSHEET_ID", "sheet-default");
vi.stubEnv("GOOGLE_DRIVE_FOLDER_BOJ", "folder-boj-default");
vi.stubEnv("GOOGLE_DRIVE_FOLDER_OTHER", "folder-other-default");

describe("getClientGoogleConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns client-specific config when DB has values", async () => {
    mockFindUnique.mockResolvedValue({
      id: "client-1",
      slug: "boj",
      name: "BOJ様",
      mappingType: "BOJ",
      calendarId: "cal-boj-custom",
      spreadsheetId: "sheet-boj-custom",
      dataSheetName: "BOJカスタム",
      pdfSheetName: "BOJ PDF カスタム",
      driveFolderId: "folder-boj-custom",
    });

    const { getClientGoogleConfig } = await import("@/lib/client-config");
    const config = await getClientGoogleConfig("client-1");

    expect(config.calendarIds).toEqual(["cal-boj-custom"]);
    expect(config.spreadsheetId).toBe("sheet-boj-custom");
    expect(config.dataSheetName).toBe("BOJカスタム");
    expect(config.pdfSheetName).toBe("BOJ PDF カスタム");
    expect(config.driveFolderId).toBe("folder-boj-custom");
    expect(config.mappingType).toBe("BOJ");
  });

  it("falls back to env defaults when DB values are null", async () => {
    mockFindUnique.mockResolvedValue({
      id: "client-2",
      slug: "test",
      name: "テスト社",
      mappingType: "BOJ",
      calendarId: null,
      spreadsheetId: null,
      dataSheetName: null,
      pdfSheetName: null,
      driveFolderId: null,
    });

    const { getClientGoogleConfig } = await import("@/lib/client-config");
    const config = await getClientGoogleConfig("client-2");

    expect(config.calendarIds).toEqual(["cal-default-1", "cal-default-2"]);
    expect(config.spreadsheetId).toBe("sheet-default");
    expect(config.dataSheetName).toBe("BOJ様用手配表");
    expect(config.driveFolderId).toBe("folder-boj-default");
  });

  it("uses OTHER sheet names when mappingType is OTHER", async () => {
    mockFindUnique.mockResolvedValue({
      id: "client-3",
      slug: "other",
      name: "その他",
      mappingType: "OTHER",
      calendarId: null,
      spreadsheetId: null,
      dataSheetName: null,
      pdfSheetName: null,
      driveFolderId: null,
    });

    const { getClientGoogleConfig } = await import("@/lib/client-config");
    const config = await getClientGoogleConfig("client-3");

    expect(config.dataSheetName).toBe("その他用手配表");
    expect(config.pdfSheetName).toBe("その他用手配表 (PDF)");
    expect(config.driveFolderId).toBe("folder-other-default");
    expect(config.mappingType).toBe("OTHER");
  });

  it("returns defaults when clientId is null (internal view)", async () => {
    const { getClientGoogleConfig } = await import("@/lib/client-config");
    const config = await getClientGoogleConfig(null);

    expect(config.calendarIds).toEqual(["cal-default-1", "cal-default-2"]);
    expect(config.spreadsheetId).toBe("sheet-default");
    expect(config.mappingType).toBe("OTHER");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("throws error when client is not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const { getClientGoogleConfig } = await import("@/lib/client-config");
    await expect(getClientGoogleConfig("nonexistent")).rejects.toThrow();
  });
});
