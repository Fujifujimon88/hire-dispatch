import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDispatchOrderNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const month = searchParams.get("month");
  const clientSlug = searchParams.get("clientSlug");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (month) where.arrangementMonth = month;

  // テナントフィルタリング
  if (clientSlug) {
    const client = await prisma.dispatchClient.findUnique({
      where: { slug: clientSlug },
    });
    if (client) {
      where.clientId = client.id;
    }
  }

  const dispatches = await prisma.dispatch.findMany({
    where,
    include: { vehicle: true, driver: true, client: true },
    orderBy: { arrangementDate: "desc" },
  });
  return NextResponse.json(dispatches);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // clientSlug → clientId 解決
    let clientId: string | null = null;
    if (body.clientSlug) {
      const client = await prisma.dispatchClient.findUnique({
        where: { slug: body.clientSlug },
      });
      if (client) clientId = client.id;
    }

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
        vehicleCount: body.vehicleCount ? parseInt(body.vehicleCount) : 1,
        customerName: body.customerName,
        customerCount: body.customerCount ? parseInt(body.customerCount) : null,
        customerContact: body.customerContact || null,
        vehicleId: body.vehicleId || null,
        driverId: body.driverId || null,
        notes: body.notes || null,
        status: "CONFIRMED",
        dispatchType: body.dispatchType || "BOJ",
        budgetPriceTaxIncluded: body.budgetPriceTaxIncluded ? parseInt(body.budgetPriceTaxIncluded) : null,
        priceComment: body.priceComment || null,
        driverInfo: body.driverInfo || null,
        internalNotifyEmails: body.internalNotifyEmails || [],
        clientNotifyEmails: body.clientNotifyEmails || [],
        clientId,
      },
      include: { vehicle: true, driver: true, client: true },
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
  } catch (e: unknown) {
    console.error("Dispatch creation error:", e);
    const message = e instanceof Error ? e.message : "保存に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
