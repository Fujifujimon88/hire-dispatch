import { google } from "googleapis";
import { getGoogleAuth } from "./google-auth";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const SHEET_NAMES = {
  BOJ_DATA: "BOJ様用手配表",
  OTHER_DATA: "その他用手配表",
  BOJ_PDF: "BOJ様用手配表 (PDF)",
  OTHER_PDF: "その他用手配表 (PDF)",
} as const;

function getSheetsClient() {
  const auth = getGoogleAuth(SCOPES);
  return google.sheets({ version: "v4", auth });
}

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SPREADSHEET_ID;
  if (!id) throw new Error("GOOGLE_SPREADSHEET_ID is not set");
  return id;
}

/**
 * データシートに行を追加（GASの saveBOJData / saveOtherData 相当）
 * 返り値: 追加された行番号
 */
export async function appendDispatchRow(
  dispatchType: "BOJ" | "OTHER",
  rowData: (string | number | null)[]
): Promise<number | null> {
  const sheets = getSheetsClient();
  const sheetName =
    dispatchType === "BOJ" ? SHEET_NAMES.BOJ_DATA : SHEET_NAMES.OTHER_DATA;
  const lastCol = dispatchType === "BOJ" ? "T" : "Q";

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `'${sheetName}'!A:${lastCol}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [rowData] },
  });

  // updatedRange から行番号を抽出 (e.g. "BOJ様用手配表!A5:T5" → 5)
  const updatedRange = response.data.updates?.updatedRange || "";
  const match = updatedRange.match(/(\d+)$/);
  return match ? parseInt(match[1]) : null;
}

/**
 * データシートの既存行を更新
 */
export async function updateDispatchRow(
  dispatchType: "BOJ" | "OTHER",
  rowNumber: number,
  rowData: (string | number | null)[]
): Promise<void> {
  const sheets = getSheetsClient();
  const sheetName =
    dispatchType === "BOJ" ? SHEET_NAMES.BOJ_DATA : SHEET_NAMES.OTHER_DATA;
  const lastCol = dispatchType === "BOJ" ? "T" : "Q";

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `'${sheetName}'!A${rowNumber}:${lastCol}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [rowData] },
  });
}

/**
 * PDFテンプレートシートにデータを転記（GASの transferData 相当）
 * cellDataMap: { "E2": "JP26-0001", "K3": "田中太郎", ... }
 */
export async function writeToTemplateSheet(
  dispatchType: "BOJ" | "OTHER",
  cellDataMap: Record<string, string | number | null>
): Promise<void> {
  const sheets = getSheetsClient();
  const sheetName =
    dispatchType === "BOJ" ? SHEET_NAMES.BOJ_PDF : SHEET_NAMES.OTHER_PDF;

  const data = Object.entries(cellDataMap)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([cell, value]) => ({
      range: `'${sheetName}'!${cell}`,
      values: [[value]],
    }));

  if (data.length === 0) return;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data,
    },
  });
}

/**
 * PDFテンプレートシートのGIDを取得（PDF出力時に必要）
 */
export async function getSheetGid(
  dispatchType: "BOJ" | "OTHER"
): Promise<number> {
  const sheets = getSheetsClient();
  const sheetName =
    dispatchType === "BOJ" ? SHEET_NAMES.BOJ_PDF : SHEET_NAMES.OTHER_PDF;

  const response = await sheets.spreadsheets.get({
    spreadsheetId: getSpreadsheetId(),
    fields: "sheets.properties",
  });

  const sheet = response.data.sheets?.find(
    (s) => s.properties?.title === sheetName
  );

  if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  return sheet.properties.sheetId;
}

/**
 * データシートの次のNO.を取得（GASの getNextNo 相当）
 */
export async function getNextNo(
  dispatchType: "BOJ" | "OTHER"
): Promise<number> {
  const sheets = getSheetsClient();
  const sheetName =
    dispatchType === "BOJ" ? SHEET_NAMES.BOJ_DATA : SHEET_NAMES.OTHER_DATA;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `'${sheetName}'!A:A`,
  });

  const values = response.data.values;
  if (!values || values.length <= 1) return 1;

  // 最後の行のA列（NO.）を取得
  const lastValue = values[values.length - 1][0];
  const lastNo = parseInt(String(lastValue));
  return isNaN(lastNo) ? 1 : lastNo + 1;
}
