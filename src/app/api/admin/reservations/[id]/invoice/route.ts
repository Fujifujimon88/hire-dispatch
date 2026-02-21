import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, generateInvoiceNumber } from "@/lib/booking-auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || !["ADMIN", "CORPORATE_ADMIN"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: { vehicle: true, invoiceItems: true, company: true },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  if (reservation.invoiceItems.length > 0) {
    return NextResponse.json({ error: "Invoice already issued" }, { status: 409 });
  }

  if (reservation.status === "CANCELLED") {
    return NextResponse.json({ error: "Cannot invoice cancelled reservation" }, { status: 400 });
  }

  if (!reservation.companyId) {
    return NextResponse.json({ error: "No company linked to this reservation" }, { status: 400 });
  }

  const subtotal = reservation.price;
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + tax;

  const pickupDate = reservation.pickupDatetime;
  const yearMonth = `${pickupDate.getFullYear()}${String(pickupDate.getMonth() + 1).padStart(2, "0")}`;
  const invoiceNumber = generateInvoiceNumber(yearMonth);

  const dueDate = new Date(pickupDate);
  dueDate.setDate(dueDate.getDate() + (reservation.company?.paymentTerms || 30));

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      companyId: reservation.companyId!,
      billingPeriodStart: new Date(pickupDate.getFullYear(), pickupDate.getMonth(), 1),
      billingPeriodEnd: new Date(pickupDate.getFullYear(), pickupDate.getMonth() + 1, 0),
      subtotal,
      tax,
      total,
      status: "ISSUED",
      issuedAt: new Date(),
      dueDate,
      items: {
        create: {
          reservationId: reservation.id,
          description: `${reservation.orderNumber} | ${reservation.pickupLocation} → ${reservation.dropoffLocation} | ${reservation.vehicle.name}`,
          amount: reservation.price,
        },
      },
    },
    include: { items: true, company: true },
  });

  return NextResponse.json(invoice, { status: 201 });
}
