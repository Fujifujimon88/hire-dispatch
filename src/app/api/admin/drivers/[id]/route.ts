import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/booking-auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || !["ADMIN", "CORPORATE_ADMIN"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const driver = await prisma.driver.update({ where: { id: params.id }, data: body });
  return NextResponse.json(driver);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user || !["ADMIN", "CORPORATE_ADMIN"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.driver.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
