import { google } from "googleapis";
import { getGoogleAuth } from "./google-auth";

function getServiceAccountAuth() {
  return getGoogleAuth(["https://www.googleapis.com/auth/calendar.events"]);
}

function getCalendarIds(): string[] {
  const ids = process.env.GOOGLE_CALENDAR_IDS || process.env.GOOGLE_CALENDAR_ID || "primary";
  return ids.split(",").map((id) => id.trim()).filter(Boolean);
}

export function getCalendarClient() {
  const auth = getServiceAccountAuth();
  return google.calendar({ version: "v3", auth });
}

export async function createCalendarEvent(data: {
  orderNumber: string;
  pickupTime: Date;
  returnTime: Date | null;
  pickupLocation: string;
  dropoffLocation: string;
  customerName: string;
  customerCount: number | null;
  vehicleName: string | null;
  driverName: string | null;
  notes: string | null;
}) {
  const calendar = getCalendarClient();

  const startTime = new Date(data.pickupTime);
  const endTime = data.returnTime
    ? new Date(data.returnTime)
    : new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

  const description = [
    `注文番号: ${data.orderNumber}`,
    `お客様: ${data.customerName}`,
    data.customerCount ? `人数: ${data.customerCount}名` : null,
    `お迎え: ${data.pickupLocation}`,
    `送り先: ${data.dropoffLocation}`,
    data.vehicleName ? `車両: ${data.vehicleName}` : null,
    data.driverName ? `ドライバー: ${data.driverName}` : null,
    data.notes ? `備考: ${data.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const requestBody = {
    summary: `[手配] ${data.customerName} ${data.pickupLocation} → ${data.dropoffLocation}`,
    description,
    start: { dateTime: startTime.toISOString(), timeZone: "Asia/Tokyo" },
    end: { dateTime: endTime.toISOString(), timeZone: "Asia/Tokyo" },
    location: data.pickupLocation,
  };

  const calendarIds = getCalendarIds();
  const results = await Promise.allSettled(
    calendarIds.map((calendarId) =>
      calendar.events.insert({ calendarId, requestBody })
    )
  );

  // 最初に成功したイベントのIDを返す
  const firstSuccess = results.find((r) => r.status === "fulfilled") as
    | PromiseFulfilledResult<{ data: { id?: string | null } }>
    | undefined;

  // 失敗したカレンダーをログ出力
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`Calendar event creation failed for ${calendarIds[i]}:`, r.reason);
    }
  });

  if (!firstSuccess) {
    throw new Error("全てのカレンダーへのイベント登録に失敗しました");
  }

  return firstSuccess.value.data.id;
}

type CalendarEventData = Parameters<typeof createCalendarEvent>[0];

function buildRequestBody(data: CalendarEventData) {
  const startTime = new Date(data.pickupTime);
  const endTime = data.returnTime
    ? new Date(data.returnTime)
    : new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

  const description = [
    `注文番号: ${data.orderNumber}`,
    `お客様: ${data.customerName}`,
    data.customerCount ? `人数: ${data.customerCount}名` : null,
    `お迎え: ${data.pickupLocation}`,
    `送り先: ${data.dropoffLocation}`,
    data.vehicleName ? `車両: ${data.vehicleName}` : null,
    data.driverName ? `ドライバー: ${data.driverName}` : null,
    data.notes ? `備考: ${data.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    summary: `[手配] ${data.customerName} ${data.pickupLocation} → ${data.dropoffLocation}`,
    description,
    start: { dateTime: startTime.toISOString(), timeZone: "Asia/Tokyo" },
    end: { dateTime: endTime.toISOString(), timeZone: "Asia/Tokyo" },
    location: data.pickupLocation,
  };
}

export async function deleteCalendarEvent(eventId: string) {
  const calendar = getCalendarClient();
  const calendarIds = getCalendarIds();

  await Promise.allSettled(
    calendarIds.map((calendarId) =>
      calendar.events.delete({ calendarId, eventId })
    )
  );
}

export async function updateCalendarEvent(oldEventId: string, data: CalendarEventData) {
  // 古いイベントを削除
  await deleteCalendarEvent(oldEventId);

  // 新しいイベントを作成（更新内容で）
  return createCalendarEvent(data);
}
