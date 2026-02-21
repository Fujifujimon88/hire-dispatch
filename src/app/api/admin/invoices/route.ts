import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/booking-auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !["ADMIN", "CORPORATE_ADMIN"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const invoices = await prisma.invoice.findMany({
    include: { company: { select: { name: true } }, items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}
