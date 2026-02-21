import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { pickupDatetime, passengerCount, luggageCount } = await req.json();

    // Find vehicles that can accommodate the passengers and luggage
    const vehicles = await prisma.vehicle.findMany({
      where: {
        isActive: true,
        maxPassengers: { gte: passengerCount || 1 },
        maxLuggage: { gte: luggageCount || 0 },
      },
      include: { grade: true },
      orderBy: [{ grade: { sortOrder: "asc" } }, { basePrice: "asc" }],
    });

    // If a datetime is provided, filter out vehicles that have conflicting reservations
    // (within a 3-hour window for buffer)
    if (pickupDatetime) {
      const dt = new Date(pickupDatetime);
      const windowStart = new Date(dt.getTime() - 3 * 60 * 60 * 1000);
      const windowEnd = new Date(dt.getTime() + 3 * 60 * 60 * 1000);

      const conflicting = await prisma.reservation.findMany({
        where: {
          pickupDatetime: { gte: windowStart, lte: windowEnd },
          status: { in: ["PENDING", "CONFIRMED", "DISPATCHED"] },
        },
        select: { vehicleId: true },
      });

      const busyIds = new Set(conflicting.map((r) => r.vehicleId));
      const available = vehicles.filter((v) => !busyIds.has(v.id));

      return NextResponse.json(available);
    }

    return NextResponse.json(vehicles);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
