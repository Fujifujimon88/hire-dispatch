import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/booking-auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !["ADMIN", "CORPORATE_ADMIN"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const locations = await prisma.location.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(locations);
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !["ADMIN", "CORPORATE_ADMIN"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const location = await prisma.location.create({ data: body });
  return NextResponse.json(location, { status: 201 });
}
