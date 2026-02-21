import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/booking-auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || !["ADMIN", "CORPORATE_ADMIN"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { status, driverId } = body;

  const data: any = {};
  if (status) data.status = status;
  if (driverId) data.driverId = driverId;

  const updated = await prisma.reservation.update({
    where: { id: params.id },
    data,
    include: { vehicle: { include: { grade: true } }, driver: true },
  });

  return NextResponse.json(updated);
}
