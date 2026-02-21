import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/booking-auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || !["ADMIN", "CORPORATE_ADMIN"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!from || !to)
    return NextResponse.json({ error: "from and to query params required" }, { status: 400 });

  const availabilities = await prisma.driverAvailability.findMany({
    where: {
      driverId: params.id,
      date: { gte: new Date(from), lte: new Date(to) },
    },
    orderBy: { date: "asc" },
  });

  const result: Record<string, string[]> = {};
  for (const a of availabilities) {
    result[a.date.toISOString().split("T")[0]] = a.timeSlots;
  }

  return NextResponse.json(result);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || !["ADMIN", "CORPORATE_ADMIN"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: Record<string, string[]> = await req.json();

  const driver = await prisma.driver.findUnique({ where: { id: params.id } });
  if (!driver)
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  await prisma.$transaction(
    Object.entries(body).map(([dateStr, timeSlots]) =>
      prisma.driverAvailability.upsert({
        where: { driverId_date: { driverId: params.id, date: new Date(dateStr) } },
        create: { driverId: params.id, date: new Date(dateStr), timeSlots },
        update: { timeSlots },
      })
    )
  );

  return NextResponse.json({ success: true });
}
