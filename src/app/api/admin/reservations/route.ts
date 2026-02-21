import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/booking-auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !["ADMIN", "CORPORATE_ADMIN"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const reservations = await prisma.reservation.findMany({
    include: {
      vehicle: { include: { grade: true } },
      user: { select: { name: true, email: true } },
      driver: { select: { name: true } },
      company: { select: { name: true } },
      invoiceItems: { include: { invoice: { select: { id: true, invoiceNumber: true, status: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reservations);
}
