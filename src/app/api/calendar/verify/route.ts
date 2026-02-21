import { NextResponse } from "next/server";
import { getCalendarClient } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  try {
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_IDS?.split(",")[0]?.trim()
      || process.env.GOOGLE_CALENDAR_ID
      || "primary";

    const event = await calendar.events.get({ calendarId, eventId });

    return NextResponse.json({
      found: true,
      summary: event.data.summary,
      start: event.data.start,
      end: event.data.end,
      status: event.data.status,
      htmlLink: event.data.htmlLink,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ found: false, error: message }, { status: 200 });
  }
}
