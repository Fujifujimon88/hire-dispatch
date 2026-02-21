import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/booking-auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !["ADMIN", "CORPORATE_ADMIN"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const vehicles = await prisma.vehicle.findMany({
    include: { grade: true },
    orderBy: [{ grade: { sortOrder: "asc" } }, { basePrice: "asc" }],
  });
  return NextResponse.json(vehicles);
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !["ADMIN", "CORPORATE_ADMIN"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const vehicle = await prisma.vehicle.create({ data: body, include: { grade: true } });
  return NextResponse.json(vehicle, { status: 201 });
}
