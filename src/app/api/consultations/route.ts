import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const consultations = await prisma.consultation.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(consultations);
}

export async function POST(req: Request) {
  const body = await req.json();

  const consultation = await prisma.consultation.create({
    data: {
      customerName: body.customerName,
      contactInfo: body.contactInfo || null,
      preferredDatetime: body.preferredDatetime ? new Date(body.preferredDatetime) : null,
      consultationDetails: body.consultationDetails || null,
      status: body.status || "CONSULTING",
      assignedTo: body.assignedTo || null,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(consultation, { status: 201 });
}
