import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/booking-auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || !["ADMIN", "CORPORATE_ADMIN"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const grade = await prisma.vehicleGrade.update({ where: { id: params.id }, data: body });
  return NextResponse.json(grade);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || !["ADMIN", "CORPORATE_ADMIN"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const vehicleCount = await prisma.vehicle.count({ where: { gradeId: params.id } });
  if (vehicleCount > 0)
    return NextResponse.json({ error: "Cannot delete grade with associated vehicles" }, { status: 400 });

  await prisma.vehicleGrade.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
