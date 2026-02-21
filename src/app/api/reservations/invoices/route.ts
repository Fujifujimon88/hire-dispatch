import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/booking-auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoiceItems = await prisma.invoiceItem.findMany({
    where: { reservation: { userId: user.id } },
    include: {
      invoice: { include: { company: { select: { name: true } } } },
      reservation: { select: { orderNumber: true, pickupLocation: true, dropoffLocation: true, pickupDatetime: true } },
    },
    orderBy: { invoice: { createdAt: "desc" } },
  });

  const invoices = invoiceItems.map((item) => ({
    id: item.invoice.id,
    invoiceNumber: item.invoice.invoiceNumber,
    total: item.invoice.total,
    status: item.invoice.status,
    issuedAt: item.invoice.issuedAt,
    dueDate: item.invoice.dueDate,
    companyName: item.invoice.company?.name,
    orderNumber: item.reservation.orderNumber,
    route: `${item.reservation.pickupLocation} → ${item.reservation.dropoffLocation}`,
    pickupDatetime: item.reservation.pickupDatetime,
    amount: item.amount,
  }));

  return NextResponse.json(invoices);
}
