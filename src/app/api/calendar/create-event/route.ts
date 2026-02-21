import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google-calendar";

export async function POST(req: Request) {
  const { dispatchId } = await req.json();

  const dispatch = await prisma.dispatch.findUnique({
    where: { id: dispatchId },
    include: { vehicle: true, driver: true },
  });

  if (!dispatch) {
    return NextResponse.json({ error: "Dispatch not found" }, { status: 404 });
  }

  try {
    const eventId = await createCalendarEvent({
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
    });

    await prisma.dispatch.update({
      where: { id: dispatchId },
      data: { calendarEventId: eventId },
    });

    return NextResponse.json({ eventId });
  } catch (error: unknown) {
    console.error("Calendar event creation failed:", error);
    const message = error instanceof Error ? error.message : "Calendar event creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
