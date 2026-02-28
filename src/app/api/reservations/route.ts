import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, generateOrderNumber } from "@/lib/booking-auth";

// GET: list user's reservations
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reservations = await prisma.reservation.findMany({
    where: { userId: user.id },
    include: { vehicle: { include: { grade: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reservations);
}

// POST: create reservation
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      vehicleId,
      pickupLocation,
      pickupPlaceId,
      pickupLat,
      pickupLng,
      dropoffLocation,
      dropoffPlaceId,
      dropoffLat,
      dropoffLng,
      pickupDatetime,
      passengerCount,
      luggageCount,
      notes,
      language,
    } = body;

    if (!vehicleId || !pickupLocation || !dropoffLocation || !pickupDatetime || !passengerCount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

    // Generate unique order number with retry
    let orderNumber = generateOrderNumber();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.reservation.findUnique({ where: { orderNumber } });
      if (!existing) break;
      orderNumber = generateOrderNumber();
      attempts++;
    }

    const reservation = await prisma.reservation.create({
      data: {
        orderNumber,
        userId: user.id,
        companyId: user.companyId,
        vehicleId,
        pickupLocation,
        pickupPlaceId,
        pickupLat,
        pickupLng,
        dropoffLocation,
        dropoffPlaceId,
        dropoffLat,
        dropoffLng,
        pickupDatetime: new Date(pickupDatetime),
        passengerCount,
        luggageCount: luggageCount || 0,
        price: vehicle.basePrice,
        status: "CONFIRMED",
        notes,
        language: language || "ja",
      },
      include: { vehicle: { include: { grade: true } } },
    });

    // TODO: Send confirmation email
    console.log(`📧 Confirmation email for ${orderNumber} → ${user.email}`);

    return NextResponse.json(reservation, { status: 201 });
  } catch (e: any) {
    console.error("Reservation creation error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
