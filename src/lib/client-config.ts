import { prisma } from "./prisma";

export type ClientGoogleConfig = {
  calendarIds: string[];
  spreadsheetId: string;
  dataSheetName: string;
  pdfSheetName: string;
  driveFolderId: string;
  mappingType: "BOJ" | "OTHER";
};

const SHEET_NAMES = {
  BOJ: { data: "BOJ様用手配表", pdf: "BOJ様用手配表 (PDF)" },
  OTHER: { data: "その他用手配表", pdf: "その他用手配表 (PDF)" },
};

export async function getClientGoogleConfig(clientId: string | null): Promise<ClientGoogleConfig> {
  const defaultCalendarIds = (process.env.GOOGLE_CALENDAR_IDS || "primary")
    .split(",").map(s => s.trim());
  const defaultSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || "";
  const defaultDriveFolderBoj = process.env.GOOGLE_DRIVE_FOLDER_BOJ || "";
  const defaultDriveFolderOther = process.env.GOOGLE_DRIVE_FOLDER_OTHER || "";

  if (!clientId) {
    return {
      calendarIds: defaultCalendarIds,
      spreadsheetId: defaultSpreadsheetId,
      dataSheetName: SHEET_NAMES.OTHER.data,
      pdfSheetName: SHEET_NAMES.OTHER.pdf,
      driveFolderId: defaultDriveFolderOther,
      mappingType: "OTHER",
    };
  }

  const client = await prisma.dispatchClient.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    throw new Error(`DispatchClient not found: ${clientId}`);
  }

  const mappingType = (client.mappingType === "BOJ" ? "BOJ" : "OTHER") as "BOJ" | "OTHER";
  const sheetDefaults = SHEET_NAMES[mappingType];
  const defaultDriveFolder = mappingType === "BOJ" ? defaultDriveFolderBoj : defaultDriveFolderOther;

  return {
    calendarIds: client.calendarId ? [client.calendarId] : defaultCalendarIds,
    spreadsheetId: client.spreadsheetId || defaultSpreadsheetId,
    dataSheetName: client.dataSheetName || sheetDefaults.data,
    pdfSheetName: client.pdfSheetName || sheetDefaults.pdf,
    driveFolderId: client.driveFolderId || defaultDriveFolder,
    mappingType,
  };
}
