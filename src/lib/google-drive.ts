import { google } from "googleapis";
import { Readable } from "stream";
import { getGoogleAuth } from "./google-auth";

const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
];

function getDriveClient() {
  const auth = getGoogleAuth(SCOPES);
  return google.drive({ version: "v3", auth });
}

function getFolderId(dispatchType: "BOJ" | "OTHER"): string {
  const id =
    dispatchType === "BOJ"
      ? process.env.GOOGLE_DRIVE_FOLDER_BOJ
      : process.env.GOOGLE_DRIVE_FOLDER_OTHER;
  if (!id) {
    throw new Error(
      `GOOGLE_DRIVE_FOLDER_${dispatchType} is not set`
    );
  }
  return id;
}

/**
 * スプレッドシートのPDFテンプレートシートをPDFとしてエクスポートし、Google Driveに保存
 * GASの createPDF 関数と同じ出力設定
 */
export async function exportSheetAsPdf(
  sheetGid: number,
  fileName: string,
  dispatchType: "BOJ" | "OTHER"
): Promise<{ fileId: string; webViewLink: string }> {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SPREADSHEET_ID is not set");

  const auth = getGoogleAuth(SCOPES);
  const authClient = await auth.getClient();

  // GASと同じPDFエクスポート設定
  const params = new URLSearchParams({
    format: "pdf",
    gid: String(sheetGid),
    size: "A4",
    portrait: "false", // 横向き
    fitw: "true",
    sheetnames: "false",
    printtitle: "false",
    pagenumbers: "false",
    gridlines: "false",
    fzr: "false",
    // 余白（インチ単位）- GASと同じ
    top_margin: "0.59",
    bottom_margin: "0.59",
    left_margin: "0.20",
    right_margin: "0.20",
    horizontal_alignment: "CENTER",
    vertical_alignment: "MIDDLE",
  });

  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?${params.toString()}`;

  const response = await authClient.request<ArrayBuffer>({
    url: exportUrl,
    responseType: "arraybuffer",
  });

  const pdfBuffer = Buffer.from(response.data);

  // Google Driveにアップロード
  const drive = getDriveClient();
  const folderId = getFolderId(dispatchType);

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: "application/pdf",
      parents: [folderId],
    },
    media: {
      mimeType: "application/pdf",
      body: Readable.from(pdfBuffer),
    },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });

  return {
    fileId: file.data.id!,
    webViewLink: file.data.webViewLink!,
  };
}

/**
 * PDFバッファをGoogle Driveにアップロード（手配管理票用）
 */
export async function uploadPdfToDrive(
  pdfBuffer: Buffer,
  fileName: string,
  dispatchType: "BOJ" | "OTHER"
): Promise<{ fileId: string; webViewLink: string }> {
  const drive = getDriveClient();
  const folderId = getFolderId(dispatchType);

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: "application/pdf",
      parents: [folderId],
    },
    media: {
      mimeType: "application/pdf",
      body: Readable.from(pdfBuffer),
    },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });

  return {
    fileId: file.data.id!,
    webViewLink: file.data.webViewLink!,
  };
}

/**
 * Google DriveからPDFファイルをダウンロード（メール添付用）
 */
export async function downloadPdfFromDrive(
  fileId: string
): Promise<{ buffer: Buffer; fileName: string }> {
  const drive = getDriveClient();

  // ファイル名取得
  const fileMeta = await drive.files.get({
    fileId,
    fields: "name",
    supportsAllDrives: true,
  });

  // ファイル内容取得
  const response = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" }
  );

  return {
    buffer: Buffer.from(response.data as ArrayBuffer),
    fileName: fileMeta.data.name || "dispatch.pdf",
  };
}
