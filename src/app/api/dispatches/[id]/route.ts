import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const dispatch = await prisma.dispatch.findUnique({
    where: { id: params.id },
    include: { vehicle: true, driver: true, client: true },
  });
  if (!dispatch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(dispatch);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();

  // 更新前のデータを取得（ログ用）
  const before = await prisma.dispatch.findUnique({
    where: { id: params.id },
    include: { vehicle: true, driver: true, client: true },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.personInCharge !== undefined) data.personInCharge = body.personInCharge;
  if (body.arrangementMonth !== undefined) data.arrangementMonth = body.arrangementMonth || null;
  if (body.arrangementDate !== undefined) data.arrangementDate = new Date(body.arrangementDate);
  if (body.pickupLocation !== undefined) data.pickupLocation = body.pickupLocation;
  if (body.pickupTime !== undefined && body.arrangementDate) {
    data.pickupTime = new Date(`${body.arrangementDate}T${body.pickupTime}:00+09:00`);
  }
  if (body.stopover !== undefined) data.stopover = body.stopover || null;
  if (body.dropoffLocation !== undefined) data.dropoffLocation = body.dropoffLocation;
  if (body.returnTime !== undefined && body.arrangementDate) {
    data.returnTime = body.returnTime ? new Date(`${body.arrangementDate}T${body.returnTime}:00+09:00`) : null;
  }
  if (body.vehicleCount !== undefined) data.vehicleCount = body.vehicleCount ? parseInt(body.vehicleCount) : 1;
  if (body.customerName !== undefined) data.customerName = body.customerName;
  if (body.customerCount !== undefined) data.customerCount = body.customerCount ? parseInt(body.customerCount) : null;
  if (body.customerContact !== undefined) data.customerContact = body.customerContact || null;
  if (body.vehicleId !== undefined) data.vehicleId = body.vehicleId || null;
  if (body.driverId !== undefined) data.driverId = body.driverId || null;
  if (body.notes !== undefined) data.notes = body.notes || null;
  if (body.status !== undefined) data.status = body.status;
  if (body.calendarEventId !== undefined) data.calendarEventId = body.calendarEventId;
  if (body.dispatchType !== undefined) data.dispatchType = body.dispatchType;
  if (body.budgetPriceTaxIncluded !== undefined) data.budgetPriceTaxIncluded = body.budgetPriceTaxIncluded ? parseInt(body.budgetPriceTaxIncluded) : null;
  if (body.priceComment !== undefined) data.priceComment = body.priceComment || null;
  if (body.driverInfo !== undefined) data.driverInfo = body.driverInfo || null;
  if (body.internalNotifyEmails !== undefined) data.internalNotifyEmails = body.internalNotifyEmails;
  if (body.clientNotifyEmails !== undefined) data.clientNotifyEmails = body.clientNotifyEmails;
  if (body.clientId !== undefined) data.clientId = body.clientId || null;

  const dispatch = await prisma.dispatch.update({
    where: { id: params.id },
    data,
    include: { vehicle: true, driver: true, client: true },
  });

  // 変更履歴を記録
  await prisma.dispatchLog.create({
    data: {
      dispatchId: params.id,
      action: "UPDATE",
      beforeData: JSON.parse(JSON.stringify(before)),
      afterData: JSON.parse(JSON.stringify(dispatch)),
    },
  });

  return NextResponse.json(dispatch);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const before = await prisma.dispatch.findUnique({
    where: { id: params.id },
    include: { vehicle: true, driver: true, client: true },
  });

  if (before) {
    await prisma.dispatchLog.create({
      data: {
        dispatchId: params.id,
        action: "DELETE",
        beforeData: JSON.parse(JSON.stringify(before)),
      },
    });
  }

  await prisma.dispatch.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
