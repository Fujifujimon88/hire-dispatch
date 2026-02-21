import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/booking-auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || (user.role !== "CORPORATE_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!user.companyId && user.role !== "ADMIN") {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const reservations = await prisma.reservation.findMany({
    where: { companyId: user.companyId! },
    include: {
      vehicle: { include: { grade: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reservations);
}
