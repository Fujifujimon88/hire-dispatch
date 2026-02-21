import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/booking-auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    userType: user.userType,
    companyId: user.companyId,
    companyName: user.company?.name,
  });
}
