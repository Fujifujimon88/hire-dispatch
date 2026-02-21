import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const logs = await prisma.dispatchLog.findMany({
    where: { dispatchId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(logs);
}
