/**
 * メール通知のHTMLテンプレート
 */

type DispatchEmailData = {
  orderNumber: string;
  personInCharge: string;
  arrangementDate: string;
  pickupLocation: string;
  pickupTime: string;
  stopover: string | null;
  dropoffLocation: string;
  returnTime: string | null;
  customerName: string;
  customerCount: number | null;
  customerContact: string | null;
  vehicleName: string | null;
  driverName: string | null;
  driverInfo: string | null;
  notes: string | null;
  dispatchType: "BOJ" | "OTHER";
};

function formatDateJP(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });
}

function formatTimeJP(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string | null | undefined): string {
  if (!value) return "";
  return `<tr><td style="padding:8px 12px;font-weight:bold;color:#555;white-space:nowrap;border-bottom:1px solid #eee;">${escapeHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(value)}</td></tr>`;
}

/**
 * 社内通知メール（全情報含む）
 */
export function buildInternalEmailHtml(data: DispatchEmailData): string {
  const typeLabel = data.dispatchType === "BOJ" ? "BOJ様用" : "その他";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:20px;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#1e3a5f,#2d5a87);color:white;padding:20px 24px;">
      <h2 style="margin:0;font-size:18px;">手配書通知 [${escapeHtml(typeLabel)}]</h2>
      <p style="margin:4px 0 0;font-size:14px;opacity:0.9;">注文番号: ${escapeHtml(data.orderNumber)}</p>
    </div>
    <div style="padding:20px 24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${row("担当者", data.personInCharge)}
        ${row("手配日", formatDateJP(data.arrangementDate))}
        ${row("お迎え場所", data.pickupLocation)}
        ${row("お迎え時間", formatTimeJP(data.pickupTime))}
        ${row("立寄り", data.stopover)}
        ${row("送り先", data.dropoffLocation)}
        ${row("帰着時間", data.returnTime ? formatTimeJP(data.returnTime) : null)}
        ${row("お客様", data.customerName)}
        ${row("人数", data.customerCount ? `${data.customerCount}名` : null)}
        ${row("連絡先", data.customerContact)}
        ${row("車種", data.vehicleName)}
        ${row("ドライバー", data.driverName)}
        ${row("車両/ドライバー/携帯", data.driverInfo)}
        ${row("備考", data.notes)}
      </table>
    </div>
    <div style="padding:12px 24px;background:#f9f9f9;font-size:12px;color:#999;border-top:1px solid #eee;">
      このメールは hire-dispatch システムから自動送信されています。
    </div>
  </div>
</body>
</html>`.trim();
}

/**
 * 顧客通知メール（必要情報のみ）
 */
export function buildClientEmailHtml(data: DispatchEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:20px;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#b8860b,#daa520);color:white;padding:20px 24px;">
      <h2 style="margin:0;font-size:18px;">手配確認書</h2>
      <p style="margin:4px 0 0;font-size:14px;opacity:0.9;">注文番号: ${escapeHtml(data.orderNumber)}</p>
    </div>
    <div style="padding:20px 24px;">
      <p style="font-size:14px;color:#333;margin:0 0 16px;">
        ${escapeHtml(data.customerName)} 様<br><br>
        いつもお世話になっております。<br>
        下記の通り手配が確定いたしましたのでご確認ください。
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${row("手配日", formatDateJP(data.arrangementDate))}
        ${row("お迎え時間", formatTimeJP(data.pickupTime))}
        ${row("お迎え場所", data.pickupLocation)}
        ${row("送り先", data.dropoffLocation)}
        ${row("車種", data.vehicleName)}
        ${row("備考", data.notes)}
      </table>
      <p style="font-size:14px;color:#333;margin:16px 0 0;">
        ご不明点がございましたら、お気軽にお問い合わせください。
      </p>
    </div>
    <div style="padding:12px 24px;background:#f9f9f9;font-size:12px;color:#999;border-top:1px solid #eee;">
      株式会社リテア
    </div>
  </div>
</body>
</html>`.trim();
}

/**
 * Dispatchレコードからメールテンプレート用データを変換
 */
export function toEmailData(dispatch: {
  orderNumber: string;
  personInCharge: string;
  arrangementDate: Date | string;
  pickupLocation: string;
  pickupTime: Date | string;
  stopover: string | null;
  dropoffLocation: string;
  returnTime: Date | string | null;
  customerName: string;
  customerCount: number | null;
  customerContact: string | null;
  vehicle?: { name: string } | null;
  driver?: { name: string } | null;
  driverInfo: string | null;
  notes: string | null;
  dispatchType: "BOJ" | "OTHER";
}): DispatchEmailData {
  return {
    orderNumber: dispatch.orderNumber,
    personInCharge: dispatch.personInCharge,
    arrangementDate: String(dispatch.arrangementDate),
    pickupLocation: dispatch.pickupLocation,
    pickupTime: String(dispatch.pickupTime),
    stopover: dispatch.stopover,
    dropoffLocation: dispatch.dropoffLocation,
    returnTime: dispatch.returnTime ? String(dispatch.returnTime) : null,
    customerName: dispatch.customerName,
    customerCount: dispatch.customerCount,
    customerContact: dispatch.customerContact,
    vehicleName: dispatch.vehicle?.name || null,
    driverName: dispatch.driver?.name || null,
    driverInfo: dispatch.driverInfo,
    notes: dispatch.notes,
    dispatchType: dispatch.dispatchType as "BOJ" | "OTHER",
  };
}
