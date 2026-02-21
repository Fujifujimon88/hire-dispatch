import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const vehicles = await prisma.vehicle.findMany({
    where: { isActive: true },
    include: { grade: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(vehicles);
}
