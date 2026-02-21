import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/booking-auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reservation = await prisma.reservation.findUnique({ where: { id: params.id } });
  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (reservation.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (reservation.status === "COMPLETED" || reservation.status === "CANCELLED") {
    return NextResponse.json({ error: "Cannot cancel" }, { status: 400 });
  }

  const updated = await prisma.reservation.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json(updated);
}
