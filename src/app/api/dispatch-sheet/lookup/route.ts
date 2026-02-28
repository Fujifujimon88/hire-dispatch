import { NextResponse } from "next/server";
import { readDispatchRowByNo } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const no = searchParams.get("no");
  const type = searchParams.get("type") as "BOJ" | "OTHER" | null;

  if (!no) {
    return NextResponse.json({ error: "NOを入力してください" }, { status: 400 });
  }

  const dispatchType = type && ["BOJ", "OTHER"].includes(type) ? type : "BOJ";

  try {
    const row = await readDispatchRowByNo(dispatchType, parseInt(no));
    if (!row) {
      return NextResponse.json({ error: `NO.${no} のデータが見つかりません` }, { status: 404 });
    }

    // BOJ: A=NO, B=注文番号, C=担当者, D=手配月, E=手配日, F=お迎え場所, G=お迎え時間,
    //      H=立寄り, I=送り場所, J=帰着時間, K=お客様, L=人数, M=お客様連絡先,
    //      N=車種, O=車両番号, P=ドライバー, Q=車両番号・ドライバー・携帯, R=備考,
    //      S=予算価格税込, T=価格コメント
    if (dispatchType === "BOJ") {
      return NextResponse.json({
        no: row[0] || "",
        orderNumber: row[1] || "",
        personInCharge: row[2] || "",
        arrangementMonth: row[3] || "",
        arrangementDate: row[4] || "",
        pickupLocation: row[5] || "",
        pickupTime: row[6] || "",
        stopover: row[7] || "",
        dropoffLocation: row[8] || "",
        returnTime: row[9] || "",
        customerName: row[10] || "",
        customerCount: row[11] || "",
        customerContact: row[12] || "",
        vehicleType: row[13] || "",
        vehicleNumber: row[14] || "",
        driverName: row[15] || "",
        driverInfo: row[16] || "",
        notes: row[17] || "",
        budgetPrice: row[18] || "",
        priceComment: row[19] || "",
      });
    }

    // OTHER: A=NO, B=注文番号, C=担当者, D=手配日, E=お迎え場所, F=お迎え時間,
    //        G=立寄り, H=送り場所, I=帰着時間, J=お客様, K=人数, L=お客様連絡先,
    //        M=車種, N=車両番号・ドライバー・携帯, O=備考, P=予算価格税込, Q=価格コメント
    return NextResponse.json({
      no: row[0] || "",
      orderNumber: row[1] || "",
      personInCharge: row[2] || "",
      arrangementDate: row[3] || "",
      pickupLocation: row[4] || "",
      pickupTime: row[5] || "",
      stopover: row[6] || "",
      dropoffLocation: row[7] || "",
      returnTime: row[8] || "",
      customerName: row[9] || "",
      customerCount: row[10] || "",
      customerContact: row[11] || "",
      vehicleType: row[12] || "",
      driverInfo: row[13] || "",
      notes: row[14] || "",
      budgetPrice: row[15] || "",
      priceComment: row[16] || "",
    });
  } catch (e) {
    console.error("Dispatch sheet lookup error:", e);
    return NextResponse.json(
      { error: "スプレッドシートの読み取りに失敗しました" },
      { status: 500 }
    );
  }
}
