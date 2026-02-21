import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, generateInvoiceNumber } from "@/lib/booking-auth";

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !["ADMIN", "CORPORATE_ADMIN"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { companyId, year, month } = await req.json();

  if (!companyId || !year || !month) {
    return NextResponse.json({ error: "companyId, year, month required" }, { status: 400 });
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  // Find completed reservations for this company in the period
  const reservations = await prisma.reservation.findMany({
    where: {
      companyId,
      status: "COMPLETED",
      pickupDatetime: { gte: start, lte: end },
      invoiceItems: { none: {} }, // Not yet invoiced
    },
    include: { vehicle: { include: { grade: true } } },
  });

  if (reservations.length === 0) {
    return NextResponse.json({ error: "No completed reservations to invoice" }, { status: 400 });
  }

  const subtotal = reservations.reduce((sum, r) => sum + r.price, 0);
  const tax = Math.floor(subtotal * 0.1); // 10% consumption tax
  const total = subtotal + tax;

  const yearMonth = `${year}${String(month).padStart(2, "0")}`;
  const invoiceNumber = generateInvoiceNumber(yearMonth);

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  const dueDate = new Date(end);
  dueDate.setDate(dueDate.getDate() + (company?.paymentTerms || 30));

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      companyId,
      billingPeriodStart: start,
      billingPeriodEnd: end,
      subtotal,
      tax,
      total,
      status: "ISSUED",
      issuedAt: new Date(),
      dueDate,
      items: {
        create: reservations.map((r) => ({
          reservationId: r.id,
          description: `${r.orderNumber} | ${r.pickupLocation} → ${r.dropoffLocation} | ${r.vehicle.name}`,
          amount: r.price,
        })),
      },
    },
    include: { items: true, company: true },
  });

  return NextResponse.json(invoice, { status: 201 });
}
