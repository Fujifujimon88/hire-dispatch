import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/booking-auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: { vehicle: { include: { grade: true } }, user: true },
  });

  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (reservation.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>領収書 ${reservation.orderNumber}</title>
<style>
  body { font-family: 'Noto Sans JP', sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
  .header { text-align: center; border-bottom: 3px double #b8963e; padding-bottom: 20px; margin-bottom: 20px; }
  .title { font-size: 24px; font-weight: bold; color: #1a1a2e; }
  .order { color: #b8963e; font-size: 14px; margin-top: 8px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  td { padding: 10px 8px; border-bottom: 1px solid #eee; }
  td:first-child { color: #777; width: 120px; }
  .total { font-size: 20px; font-weight: bold; text-align: right; color: #b8963e; border-top: 2px solid #1a1a2e; padding-top: 12px; }
  .footer { text-align: center; color: #999; font-size: 12px; margin-top: 40px; }
  @media print { body { margin: 0; } }
</style></head>
<body>
  <div class="header">
    <div class="title">領 収 書</div>
    <div class="order">${reservation.orderNumber}</div>
  </div>
  <table>
    <tr><td>ご利用日時</td><td>${new Date(reservation.pickupDatetime).toLocaleString("ja-JP")}</td></tr>
    <tr><td>配車先</td><td>${reservation.pickupLocation}</td></tr>
    <tr><td>お供先</td><td>${reservation.dropoffLocation}</td></tr>
    <tr><td>車両</td><td>${reservation.vehicle.name}（${reservation.vehicle.grade.name}）</td></tr>
    <tr><td>人数</td><td>${reservation.passengerCount}名</td></tr>
    <tr><td>荷物</td><td>${reservation.luggageCount}個</td></tr>
  </table>
  <div class="total">合計（税込）: ¥${reservation.price.toLocaleString()}</div>
  <div class="footer">
    <p>プレミアムハイヤー株式会社</p>
    <p>発行日: ${new Date().toLocaleDateString("ja-JP")}</p>
  </div>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="receipt-${reservation.orderNumber}.html"`,
    },
  });
}
