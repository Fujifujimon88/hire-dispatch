import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateCalendarEvent, createCalendarEvent } from "@/lib/google-calendar";

export async function POST(req: Request) {
  const { dispatchId } = await req.json();

  const dispatch = await prisma.dispatch.findUnique({
    where: { id: dispatchId },
    include: { vehicle: true, driver: true },
  });

  if (!dispatch) {
    return NextResponse.json({ error: "Dispatch not found" }, { status: 404 });
  }

  const eventData = {
    orderNumber: dispatch.orderNumber,
    pickupTime: dispatch.pickupTime,
    returnTime: dispatch.returnTime,
    pickupLocation: dispatch.pickupLocation,
    dropoffLocation: dispatch.dropoffLocation,
    customerName: dispatch.customerName,
    customerCount: dispatch.customerCount,
    vehicleName: dispatch.vehicle?.name || null,
    driverName: dispatch.driver?.name || null,
    notes: dispatch.notes,
  };

  try {
    let newEventId: string | null | undefined;

    if (dispatch.calendarEventId) {
      // 既存イベントを削除して新規作成
      newEventId = await updateCalendarEvent(dispatch.calendarEventId, eventData);
    } else {
      // カレンダー未登録の場合は新規作成
      newEventId = await createCalendarEvent(eventData);
    }

    await prisma.dispatch.update({
      where: { id: dispatchId },
      data: { calendarEventId: newEventId },
    });

    return NextResponse.json({ eventId: newEventId });
  } catch (error: unknown) {
    console.error("Calendar event update failed:", error);
    const message = error instanceof Error ? error.message : "Calendar event update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
