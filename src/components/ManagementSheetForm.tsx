"use client";

export type ManagementSheetData = {
  // 基本
  no: string;
  orderNumber: string;
  tourCode: string;
  pickupDate: string;
  pickupTime: string;
  otherInfo: string;
  notes1: string;
  // 時間
  returnToGarageTime: string;
  departureFromGarageTime: string;
  specialHours: string;
  // 立ち寄り
  stopoverPlace: string;
  stopoverNotes: string;
  // 走行キロ
  departureKm: string;
  boardingKm: string;
  returnKm: string;
  alightingKm: string;
  // 通行料・駐車代
  tollCash: string[];
  tollEtc: string[];
  parkingFees: string[];
  // 送り
  dropoffTime: string;
  dropoffTimeNotes: string;
  // 担当
  personInCharge: string;
  personInChargeTel: string;
  receptionDate: string;
  receptionist: string;
  // 右側
  applicantName: string;
  partyCount: string;
  paymentMethod: string;
  luggageContent: string;
  customerContact: string;
  customerEmail: string;
  otherMemo: string;
  otherNotes: string;
  vehicleType: string;
  vehicleNumber: string;
  driverName: string;
  driverContact: string;
  overtimeFees: string;
  completionNotes: string;
};

export const emptyFormData: ManagementSheetData = {
  no: "", orderNumber: "", tourCode: "",
  pickupDate: "", pickupTime: "", otherInfo: "", notes1: "",
  returnToGarageTime: "", departureFromGarageTime: "", specialHours: "",
  stopoverPlace: "", stopoverNotes: "",
  departureKm: "", boardingKm: "", returnKm: "", alightingKm: "",
  tollCash: ["", "", "", "", ""],
  tollEtc: ["", "", "", "", ""],
  parkingFees: ["", "", ""],
  dropoffTime: "", dropoffTimeNotes: "",
  personInCharge: "", personInChargeTel: "", receptionDate: "", receptionist: "",
  applicantName: "", partyCount: "", paymentMethod: "", luggageContent: "",
  customerContact: "", customerEmail: "", otherMemo: "", otherNotes: "",
  vehicleType: "", vehicleNumber: "", driverName: "", driverContact: "",
  overtimeFees: "", completionNotes: "",
};

// 時間差計算 (HH:MM形式)
function calcTimeDiff(start: string, end: string): string {
  if (!start || !end) return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return "";
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

function calcKmDiff(a: string, b: string): string {
  const an = parseFloat(a);
  const bn = parseFloat(b);
  if (isNaN(an) || isNaN(bn)) return "";
  return String(bn - an);
}

const td = "border border-black px-1.5 py-1 text-[11px]";
const tdLabel = `${td} bg-gray-100 font-semibold whitespace-nowrap`;
const inp = "border-none bg-transparent w-full text-[11px] outline-none py-0.5";
const inpNum = `${inp} text-right`;

type Props = {
  data: ManagementSheetData;
  onChange: (field: keyof ManagementSheetData, value: string) => void;
  onArrayChange: (field: "tollCash" | "tollEtc" | "parkingFees", index: number, value: string) => void;
};

export function ManagementSheetForm({ data, onChange, onArrayChange }: Props) {
  const usageTime = calcTimeDiff(data.departureFromGarageTime, data.returnToGarageTime);
  const diffKm = calcKmDiff(data.departureKm, data.returnKm);
  const usageKm = calcKmDiff(data.boardingKm, data.alightingKm);

  return (
    <div id="management-sheet-print-area" className="flex gap-0 text-[11px] leading-tight">
      {/* ========== 左パネル ========== */}
      <table className="border-collapse border-2 border-black w-[55%] align-top" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "100px" }} />
          <col style={{ width: "auto" }} />
          <col style={{ width: "90px" }} />
          <col style={{ width: "80px" }} />
          <col style={{ width: "70px" }} />
          <col style={{ width: "70px" }} />
        </colgroup>
        <tbody>
          {/* タイトル */}
          <tr>
            <td colSpan={6} className={`${td} text-center font-bold text-base py-1.5`}>
              手配管理票
            </td>
          </tr>

          {/* 受注No / ツアーCode */}
          <tr>
            <td className={tdLabel}>受注No:</td>
            <td className={td}>
              <input className={inp} value={data.orderNumber} onChange={e => onChange("orderNumber", e.target.value)} />
            </td>
            <td className={tdLabel}>ツアーCode:</td>
            <td colSpan={3} className={td}>
              <input className={inp} value={data.tourCode} onChange={e => onChange("tourCode", e.target.value)} />
            </td>
          </tr>

          {/* お迎え日 / お迎え時間 */}
          <tr>
            <td className={tdLabel}>お迎え日</td>
            <td className={td}>
              <input className={inp} value={data.pickupDate} onChange={e => onChange("pickupDate", e.target.value)} placeholder="2024年12月16日" />
            </td>
            <td className={tdLabel}>お迎え時間</td>
            <td colSpan={3} className={td}>
              <input className={inp} value={data.pickupTime} onChange={e => onChange("pickupTime", e.target.value)} placeholder="13:30" />
            </td>
          </tr>

          {/* その他情報 */}
          <tr>
            <td className={tdLabel}>その他情報</td>
            <td colSpan={5} className={td}>
              <textarea className={`${inp} resize-none`} rows={3} value={data.otherInfo} onChange={e => onChange("otherInfo", e.target.value)} placeholder="成田空港第2ターミナル" />
            </td>
          </tr>

          {/* 備考① + 右に時間セクション */}
          <tr>
            <td className={tdLabel} rowSpan={5}>備考①</td>
            <td className={td} rowSpan={5}>
              <textarea className={`${inp} resize-none`} rows={5} value={data.notes1} onChange={e => onChange("notes1", e.target.value)} />
            </td>
            <td className={tdLabel}>帰庫時間</td>
            <td colSpan={3} className={td}>
              <input className={inp} value={data.returnToGarageTime} onChange={e => onChange("returnToGarageTime", e.target.value)} placeholder="20:00" />
            </td>
          </tr>
          <tr>
            <td className={tdLabel}>出庫時間</td>
            <td colSpan={3} className={td}>
              <input className={inp} value={data.departureFromGarageTime} onChange={e => onChange("departureFromGarageTime", e.target.value)} placeholder="12:00" />
            </td>
          </tr>
          <tr>
            <td className={tdLabel}>使用時間</td>
            <td colSpan={3} className={`${td} bg-yellow-50 font-semibold`}>
              {usageTime || "-"}
            </td>
          </tr>
          <tr>
            <td className={tdLabel}>特殊時間</td>
            <td colSpan={3} className={td}>
              <input className={inp} value={data.specialHours} onChange={e => onChange("specialHours", e.target.value)} />
            </td>
          </tr>
          <tr>
            <td colSpan={4} className={td} />
          </tr>

          {/* 立ち寄り */}
          <tr>
            <td className={tdLabel}>立ち寄り場所</td>
            <td colSpan={5} className={td}>
              <input className={inp} value={data.stopoverPlace} onChange={e => onChange("stopoverPlace", e.target.value)} placeholder="横浜中華街" />
            </td>
          </tr>
          <tr>
            <td className={tdLabel}>立ち寄り備考</td>
            <td colSpan={5} className={td}>
              <input className={inp} value={data.stopoverNotes} onChange={e => onChange("stopoverNotes", e.target.value)} placeholder="食事休憩30分" />
            </td>
          </tr>

          {/* 走行キロ/実車キロ */}
          <tr>
            <td colSpan={2} className={`${td} text-center font-semibold bg-gray-100`}>走行キロ / 実車キロ</td>
            <td className={tdLabel}>出庫km</td>
            <td className={td}>
              <input className={inpNum} value={data.departureKm} onChange={e => onChange("departureKm", e.target.value)} />
            </td>
            <td className={tdLabel}>乗車km</td>
            <td className={td}>
              <input className={inpNum} value={data.boardingKm} onChange={e => onChange("boardingKm", e.target.value)} />
            </td>
          </tr>
          <tr>
            <td colSpan={2} className={td} />
            <td className={tdLabel}>帰庫km</td>
            <td className={td}>
              <input className={inpNum} value={data.returnKm} onChange={e => onChange("returnKm", e.target.value)} />
            </td>
            <td className={tdLabel}>降車km</td>
            <td className={td}>
              <input className={inpNum} value={data.alightingKm} onChange={e => onChange("alightingKm", e.target.value)} />
            </td>
          </tr>
          <tr>
            <td colSpan={2} className={td} />
            <td className={tdLabel}>差引km</td>
            <td className={`${td} bg-yellow-50 font-semibold text-right`}>{diffKm || "-"}</td>
            <td className={tdLabel}>使用km</td>
            <td className={`${td} bg-yellow-50 font-semibold text-right`}>{usageKm || "-"}</td>
          </tr>

          {/* 通行料 現金 */}
          {data.tollCash.map((v, i) => (
            <tr key={`tc${i}`}>
              {i === 0 && <td className={tdLabel} rowSpan={5}>通行料 現金</td>}
              <td className={tdLabel}>{i + 1}</td>
              <td colSpan={4} className={td}>
                <div className="flex items-center">
                  <input className={`${inpNum} flex-1`} value={v} onChange={e => onArrayChange("tollCash", i, e.target.value)} placeholder="0" />
                  <span className="text-[11px] shrink-0 pl-1">円</span>
                </div>
              </td>
            </tr>
          ))}

          {/* 通行料 ETC */}
          {data.tollEtc.map((v, i) => (
            <tr key={`te${i}`}>
              {i === 0 && <td className={tdLabel} rowSpan={5}>通行料 ETC</td>}
              <td className={tdLabel}>{i + 1}</td>
              <td colSpan={4} className={td}>
                <div className="flex items-center">
                  <input className={`${inpNum} flex-1`} value={v} onChange={e => onArrayChange("tollEtc", i, e.target.value)} placeholder="0" />
                  <span className="text-[11px] shrink-0 pl-1">円</span>
                </div>
              </td>
            </tr>
          ))}

          {/* 駐車代 */}
          {data.parkingFees.map((v, i) => (
            <tr key={`pf${i}`}>
              {i === 0 && <td className={tdLabel} rowSpan={3}>駐車代</td>}
              <td className={tdLabel}>{i + 1}</td>
              <td colSpan={4} className={td}>
                <div className="flex items-center">
                  <input className={`${inpNum} flex-1`} value={v} onChange={e => onArrayChange("parkingFees", i, e.target.value)} placeholder="0" />
                  <span className="text-[11px] shrink-0 pl-1">円</span>
                </div>
              </td>
            </tr>
          ))}

          {/* 送り時間 */}
          <tr>
            <td className={tdLabel}>送り時間</td>
            <td colSpan={5} className={td}>
              <input className={inp} value={data.dropoffTime} onChange={e => onChange("dropoffTime", e.target.value)} placeholder="19:00" />
            </td>
          </tr>
          <tr>
            <td className={tdLabel}>送り時間備考</td>
            <td colSpan={5} className={td}>
              <input className={inp} value={data.dropoffTimeNotes} onChange={e => onChange("dropoffTimeNotes", e.target.value)} />
            </td>
          </tr>

          {/* ご担当者様 */}
          <tr>
            <td className={tdLabel}>ご担当者様</td>
            <td className={td}>
              <input className={inp} value={data.personInCharge} onChange={e => onChange("personInCharge", e.target.value)} />
            </td>
            <td className={tdLabel}>TEL</td>
            <td colSpan={3} className={td}>
              <input className={inp} value={data.personInChargeTel} onChange={e => onChange("personInChargeTel", e.target.value)} placeholder="045-9876-5432" />
            </td>
          </tr>

          {/* 受付日 */}
          <tr>
            <td className={tdLabel}>受付日</td>
            <td className={td}>
              <input className={inp} value={data.receptionDate} onChange={e => onChange("receptionDate", e.target.value)} placeholder="2024/12/02" />
            </td>
            <td className={tdLabel}>受付者</td>
            <td colSpan={3} className={td}>
              <input className={inp} value={data.receptionist} onChange={e => onChange("receptionist", e.target.value)} />
            </td>
          </tr>
        </tbody>
      </table>

      {/* ========== 右パネル ========== */}
      <table className="border-collapse border-2 border-l-0 border-black w-[45%] align-top" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "130px" }} />
          <col style={{ width: "auto" }} />
        </colgroup>
        <tbody>
          {/* タイトル */}
          <tr>
            <td colSpan={2} className={`${td} text-center font-bold text-base py-1.5`}>
              手配指示書・完了報告票
            </td>
          </tr>

          {/* 支払い方法ヘッダー */}
          <tr>
            <td colSpan={2} className={`${td} text-center font-semibold bg-orange-50 text-[10px]`}>
              支払い方法（現金・クレジット・請求書）
            </td>
          </tr>

          {/* お申込み者名 / 支払い方法 */}
          <tr>
            <td className={tdLabel}>お申込み者名</td>
            <td className={td}>
              <input className={inp} value={data.applicantName} onChange={e => onChange("applicantName", e.target.value)} />
            </td>
          </tr>
          <tr>
            <td className={tdLabel}>先方人数</td>
            <td className={td}>
              <div className="flex items-center">
                <input className={`${inpNum} flex-1`} value={data.partyCount} onChange={e => onChange("partyCount", e.target.value)} placeholder="2" />
                <span className="text-[11px] shrink-0 pl-2 pr-1">名</span>
              </div>
            </td>
          </tr>
          <tr>
            <td className={tdLabel}>支払い方法</td>
            <td className={td}>
              <div className="flex gap-3 py-0.5">
                {["現金", "クレジット", "請求書"].map(m => (
                  <label key={m} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio" name="paymentMethod"
                      checked={data.paymentMethod === m}
                      onChange={() => onChange("paymentMethod", m)}
                      className="w-3 h-3"
                    />
                    <span className="text-[11px]">{m}</span>
                  </label>
                ))}
              </div>
            </td>
          </tr>

          {/* 荷物 */}
          <tr>
            <td className={tdLabel}>荷物内容</td>
            <td className={td}>
              <textarea className={`${inp} resize-none`} rows={2} value={data.luggageContent} onChange={e => onChange("luggageContent", e.target.value)} placeholder="大型スーツケース2個、手荷物" />
            </td>
          </tr>

          {/* 連絡先 */}
          <tr>
            <td className={tdLabel}>お客様連絡先</td>
            <td className={td}>
              <input className={inp} value={data.customerContact} onChange={e => onChange("customerContact", e.target.value)} placeholder="080-5555-6666" />
            </td>
          </tr>
          <tr>
            <td className={tdLabel}>お客様メール<br />(決済用)</td>
            <td className={td}>
              <input className={inp} value={data.customerEmail} onChange={e => onChange("customerEmail", e.target.value)} placeholder="sasaki@example.com" />
            </td>
          </tr>

          {/* その他メモ */}
          <tr>
            <td className={tdLabel}>その他メモ</td>
            <td className={td}>
              <textarea className={`${inp} resize-none`} rows={2} value={data.otherMemo} onChange={e => onChange("otherMemo", e.target.value)} placeholder="チャイルドシート1台" />
            </td>
          </tr>

          {/* その他 */}
          <tr>
            <td className={tdLabel}>その他</td>
            <td className={td}>
              <textarea className={`${inp} resize-none`} rows={3} value={data.otherNotes} onChange={e => onChange("otherNotes", e.target.value)} />
            </td>
          </tr>

          {/* 車両・ドライバー */}
          <tr>
            <td className={tdLabel}>車種</td>
            <td className={td}>
              <input className={inp} value={data.vehicleType} onChange={e => onChange("vehicleType", e.target.value)} placeholder="ハイエース" />
            </td>
          </tr>
          <tr>
            <td className={tdLabel}>車両No</td>
            <td className={td}>
              <input className={inp} value={data.vehicleNumber} onChange={e => onChange("vehicleNumber", e.target.value)} placeholder="横浜300さ5678" />
            </td>
          </tr>
          <tr>
            <td className={tdLabel}>運転者</td>
            <td className={td}>
              <input className={inp} value={data.driverName} onChange={e => onChange("driverName", e.target.value)} placeholder="小林太一" />
            </td>
          </tr>
          <tr>
            <td className={tdLabel}>運転者連絡先</td>
            <td className={td}>
              <input className={inp} value={data.driverContact} onChange={e => onChange("driverContact", e.target.value)} placeholder="090-7777-8888" />
            </td>
          </tr>

          {/* 料金 */}
          <tr>
            <td className={tdLabel}>その他/<br />残業発生料金</td>
            <td className={td}>
              <textarea className={`${inp} resize-none`} rows={2} value={data.overtimeFees} onChange={e => onChange("overtimeFees", e.target.value)} />
            </td>
          </tr>

          {/* 完了 */}
          <tr>
            <td className={tdLabel}>完了/完了連絡</td>
            <td className={td}>
              <textarea className={`${inp} resize-none`} rows={2} value={data.completionNotes} onChange={e => onChange("completionNotes", e.target.value)} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
