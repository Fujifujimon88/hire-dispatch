/**
 * Dispatch → スプレッドシート行データ / PDFテンプレートセルのマッピング
 * GASの saveBOJData / saveOtherData / transferData_BOJ / transferData_Other に対応
 */

type DispatchWithRelations = {
  orderNumber: string;
  personInCharge: string;
  arrangementMonth: string | null;
  arrangementDate: Date | string;
  pickupLocation: string;
  pickupTime: Date | string;
  stopover: string | null;
  dropoffLocation: string;
  returnTime: Date | string | null;
  customerName: string;
  customerCount: number | null;
  customerContact: string | null;
  vehicle?: { name: string; plateNumber?: string | null } | null;
  driver?: { name: string; phone?: string | null } | null;
  driverInfo: string | null;
  notes: string | null;
  budgetPriceTaxIncluded: number | null;
  priceComment: string | null;
};

function formatDateJP(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });
}

function formatTimeJP(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateForSheet(date: Date | string): string {
  // Google Sheetsが日付として認識する形式
  const d = new Date(date);
  const y = d.toLocaleString("en", { year: "numeric", timeZone: "Asia/Tokyo" });
  const m = d.toLocaleString("en", { month: "2-digit", timeZone: "Asia/Tokyo" });
  const day = d.toLocaleString("en", { day: "2-digit", timeZone: "Asia/Tokyo" });
  return `${y}/${m}/${day}`;
}

/**
 * BOJ様用手配表の行データ (A-T列)
 */
export function mapDispatchToBOJRow(
  no: number,
  dispatch: DispatchWithRelations
): (string | number | null)[] {
  return [
    no, // A: NO.
    dispatch.orderNumber, // B: 注文番号
    dispatch.personInCharge, // C: 担当者
    dispatch.arrangementMonth || "", // D: 手配月
    formatDateForSheet(dispatch.arrangementDate), // E: 手配日
    dispatch.pickupLocation, // F: お迎え場所
    formatTimeJP(dispatch.pickupTime), // G: お迎え時間
    dispatch.stopover || "", // H: 立寄り
    dispatch.dropoffLocation, // I: 送り場所
    dispatch.returnTime ? formatTimeJP(dispatch.returnTime) : "", // J: 帰着時間
    dispatch.customerName, // K: お客様
    dispatch.customerCount ?? "", // L: 人数
    dispatch.customerContact || "", // M: お客様連絡先
    dispatch.vehicle?.name || "", // N: 車種
    dispatch.vehicle?.plateNumber || "", // O: 車両番号
    dispatch.driver?.name || "", // P: ドライバー
    dispatch.driverInfo || "", // Q: 車両番号・ドライバー・携帯
    dispatch.notes || "", // R: 備考
    dispatch.budgetPriceTaxIncluded ?? "", // S: 予算価格税込
    dispatch.priceComment || "", // T: 価格コメント
  ];
}

/**
 * その他用手配表の行データ (A-Q列)
 */
export function mapDispatchToOtherRow(
  no: number,
  dispatch: DispatchWithRelations
): (string | number | null)[] {
  return [
    no, // A: NO.
    dispatch.orderNumber, // B: 注文番号
    dispatch.personInCharge, // C: 担当者
    formatDateForSheet(dispatch.arrangementDate), // D: 手配日
    dispatch.pickupLocation, // E: お迎え場所
    formatTimeJP(dispatch.pickupTime), // F: お迎え時間
    dispatch.stopover || "", // G: 立寄り
    dispatch.dropoffLocation, // H: 送り場所
    dispatch.returnTime ? formatTimeJP(dispatch.returnTime) : "", // I: 帰着時間
    dispatch.customerName, // J: お客様
    dispatch.customerCount ?? "", // K: 人数
    dispatch.customerContact || "", // L: お客様連絡先
    dispatch.vehicle?.name || "", // M: 車種
    dispatch.driverInfo || "", // N: 車両番号・ドライバー・携帯
    dispatch.notes || "", // O: 備考
    dispatch.budgetPriceTaxIncluded ?? "", // P: 予算価格税込
    dispatch.priceComment || "", // Q: 価格コメント
  ];
}

/**
 * BOJ様用PDFテンプレートのセルマッピング
 * GASの transferData_BOJ と同じマッピング
 */
export function mapDispatchToBOJTemplate(
  no: number,
  dispatch: DispatchWithRelations
): Record<string, string | number> {
  return {
    B3: no, // NO
    E2: dispatch.orderNumber, // 注文番号
    E30: dispatch.personInCharge, // 担当者
    E31: formatDateForSheet(dispatch.arrangementDate), // 手配日
    E5: dispatch.pickupLocation, // お迎え場所
    E4: formatTimeJP(dispatch.pickupTime), // お迎え時間
    E12: dispatch.stopover || "", // 立寄り
    E21: dispatch.dropoffLocation, // 送り場所
    E20: dispatch.returnTime ? formatTimeJP(dispatch.returnTime) : "", // 帰着時間
    K3: dispatch.customerName, // お客様
    K4: dispatch.customerCount ?? "", // 人数
    P5: dispatch.customerContact || "", // お客様連絡先
    P18: dispatch.vehicle?.name || "", // 車種
    P20: dispatch.vehicle?.plateNumber || "", // 車両番号
    P22: dispatch.driver?.name || "", // ドライバー
    P24: dispatch.driverInfo || "", // 車両番号・ドライバー・携帯
    D13: dispatch.notes || "", // 備考
  };
}

/**
 * その他用PDFテンプレートのセルマッピング
 * GASの transferData_Other と同じマッピング
 */
export function mapDispatchToOtherTemplate(
  no: number,
  dispatch: DispatchWithRelations
): Record<string, string | number> {
  return {
    B3: no, // NO
    E2: dispatch.orderNumber, // 注文番号
    E30: dispatch.personInCharge, // 担当者
    E31: formatDateForSheet(dispatch.arrangementDate), // 手配日
    E5: dispatch.pickupLocation, // お迎え場所
    E4: formatTimeJP(dispatch.pickupTime), // お迎え時間
    E12: dispatch.stopover || "", // 立寄り
    E21: dispatch.dropoffLocation, // 送り場所
    E20: dispatch.returnTime ? formatTimeJP(dispatch.returnTime) : "", // 帰着時間
    K3: dispatch.customerName, // お客様
    K4: dispatch.customerCount ?? "", // 人数
    P5: dispatch.customerContact || "", // お客様連絡先
    P18: dispatch.vehicle?.name || "", // 車種
    P20: dispatch.driverInfo || "", // 車両番号・ドライバー・携帯
    D13: dispatch.notes || "", // 備考
  };
}

/**
 * PDFファイル名を生成（GASと同じ命名規則）
 */
export function generatePdfFileName(
  dispatchType: "BOJ" | "OTHER",
  no: number,
  orderNumber: string,
  arrangementDate: Date | string
): string {
  const d = new Date(arrangementDate);
  const y = d.toLocaleString("en", { year: "numeric", timeZone: "Asia/Tokyo" });
  const m = d.toLocaleString("en", { month: "2-digit", timeZone: "Asia/Tokyo" });
  const day = d.toLocaleString("en", { day: "2-digit", timeZone: "Asia/Tokyo" });
  const dateStr = `${y}${m}${day}`;

  if (dispatchType === "BOJ") {
    return `BOJ様用手配表_NO.${no}_${orderNumber}_${dateStr}.pdf`;
  }
  return `その他手配表_NO.${no}_${orderNumber}_${dateStr}.pdf`;
}
