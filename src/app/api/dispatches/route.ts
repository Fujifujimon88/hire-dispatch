import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDispatchOrderNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const month = searchParams.get("month");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (month) where.arrangementMonth = month;

  const dispatches = await prisma.dispatch.findMany({
    where,
    include: { vehicle: true, driver: true },
    orderBy: { arrangementDate: "desc" },
  });
  return NextResponse.json(dispatches);
}

export async function POST(req: Request) {
  const body = await req.json();

  const dispatch = await prisma.dispatch.create({
    data: {
      orderNumber: body.orderNumber || generateDispatchOrderNumber(),
      personInCharge: body.personInCharge,
      arrangementMonth: body.arrangementMonth || null,
      arrangementDate: new Date(body.arrangementDate),
      pickupLocation: body.pickupLocation,
      pickupTime: new Date(`${body.arrangementDate}T${body.pickupTime}:00+09:00`),
      stopover: body.stopover || null,
      dropoffLocation: body.dropoffLocation,
      returnTime: body.returnTime ? new Date(`${body.arrangementDate}T${body.returnTime}:00+09:00`) : null,
      customerName: body.customerName,
      customerCount: body.customerCount ? parseInt(body.customerCount) : null,
      customerContact: body.customerContact || null,
      vehicleId: body.vehicleId || null,
      driverId: body.driverId || null,
      notes: body.notes || null,
      status: "CONFIRMED",
      dispatchType: body.dispatchType || "OTHER",
      budgetPriceTaxIncluded: body.budgetPriceTaxIncluded ? parseInt(body.budgetPriceTaxIncluded) : null,
      priceComment: body.priceComment || null,
      driverInfo: body.driverInfo || null,
      internalNotifyEmails: body.internalNotifyEmails || [],
      clientNotifyEmails: body.clientNotifyEmails || [],
    },
    include: { vehicle: true, driver: true },
  });

  // 作成ログ
  await prisma.dispatchLog.create({
    data: {
      dispatchId: dispatch.id,
      action: "CREATE",
      afterData: JSON.parse(JSON.stringify(dispatch)),
    },
  });

  return NextResponse.json(dispatch, { status: 201 });
}
