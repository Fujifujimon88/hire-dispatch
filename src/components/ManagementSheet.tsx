"use client";
import { useState, useCallback, useRef } from "react";
import { ManagementSheetForm, emptyFormData } from "./ManagementSheetForm";
import type { ManagementSheetData } from "./ManagementSheetForm";
import {
  ChevronRight, Search, Printer, RotateCcw, Loader2, FileText,
  Upload, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ManagementSheet() {
  const [lookupNo, setLookupNo] = useState("");
  const [dispatchType, setDispatchType] = useState<"BOJ" | "OTHER">("BOJ");
  const [formData, setFormData] = useState<ManagementSheetData>({ ...emptyFormData });
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback((field: keyof ManagementSheetData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleArrayChange = useCallback((
    field: "tollCash" | "tollEtc" | "parkingFees",
    index: number,
    value: string,
  ) => {
    setFormData(prev => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  }, []);

  async function handleLookup() {
    if (!lookupNo.trim()) {
      setMessage("NOを入力してください");
      return;
    }
    setLoading(true);
    setMessage("");
    setDriveLink("");
    try {
      const res = await fetch(
        `/api/dispatch-sheet/lookup?no=${encodeURIComponent(lookupNo.trim())}&type=${dispatchType}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "データの取得に失敗しました");
      }
      const d = await res.json();

      setFormData(prev => ({
        ...prev,
        no: d.no || prev.no,
        orderNumber: d.orderNumber || prev.orderNumber,
        pickupDate: d.arrangementDate || prev.pickupDate,
        pickupTime: d.pickupTime || prev.pickupTime,
        otherInfo: d.pickupLocation || prev.otherInfo,
        notes1: d.notes || prev.notes1,
        stopoverPlace: d.stopover || prev.stopoverPlace,
        dropoffTime: d.returnTime || prev.dropoffTime,
        personInCharge: d.personInCharge || prev.personInCharge,
        receptionDate: d.arrangementDate || prev.receptionDate,
        applicantName: d.customerName || prev.applicantName,
        partyCount: d.customerCount || prev.partyCount,
        customerContact: d.customerContact || prev.customerContact,
        vehicleType: d.vehicleType || prev.vehicleType,
        vehicleNumber: d.vehicleNumber || prev.vehicleNumber,
        driverName: d.driverName || prev.driverName,
        driverContact: d.driverInfo || prev.driverContact,
      }));
      setMessage(`NO.${d.no} のデータを読み込みました`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePdf() {
    if (!formRef.current) return;

    setPdfLoading(true);
    setMessage("");
    setDriveLink("");

    // html2canvasはinput/textareaの値をキャプチャできないため、
    // 一時的にテキスト要素に置き換える
    const container = formRef.current;
    const restoreFns: (() => void)[] = [];

    container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea").forEach(el => {
      const val = el.value;
      if (el.type === "radio") return;

      const span = document.createElement("span");
      span.textContent = val;
      span.style.cssText = el.tagName === "TEXTAREA"
        ? "white-space: pre-wrap; font-size: 11px; display: block; width: 100%; min-height: 20px; padding: 2px 4px; color: #000000;"
        : "font-size: 11px; display: inline-block; width: 100%; padding: 2px 4px; color: #000000;";
      if (el.className.includes("text-right")) {
        span.style.textAlign = "right";
      }
      el.style.display = "none";
      el.parentNode?.insertBefore(span, el.nextSibling);
      restoreFns.push(() => {
        el.style.display = "";
        span.remove();
      });
    });

    // ラジオボタンの選択もテキスト表示に変換
    container.querySelectorAll<HTMLInputElement>("input[type='radio']").forEach(el => {
      if (el.checked) {
        const label = el.parentElement;
        if (label) {
          label.style.fontWeight = "bold";
          restoreFns.push(() => { label.style.fontWeight = ""; });
        }
      }
    });

    const restore = () => restoreFns.forEach(fn => fn());

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      // フォーム部分をキャプチャ
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      // 入力欄を元に戻す
      restore();

      // A4横 PDF作成
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pageWidth = 297;
      const pageHeight = 210;
      const imgWidth = pageWidth - 16; // 8mm margin each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // 高さがページに収まるようにスケール
      const finalHeight = Math.min(imgHeight, pageHeight - 16);
      const finalWidth = imgHeight > pageHeight - 16
        ? (canvas.width * finalHeight) / canvas.height
        : imgWidth;

      const xOffset = (pageWidth - finalWidth) / 2;
      const yOffset = 8;

      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        xOffset, yOffset, finalWidth, finalHeight
      );

      // PDF → base64
      const pdfBase64 = pdf.output("datauristring").split(",")[1];

      // ファイル名生成
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      const noStr = formData.no || "0";
      const orderStr = formData.orderNumber || "draft";
      const fileName = `手配管理票_NO.${noStr}_${orderStr}_${dateStr}.pdf`;

      // Google Driveにアップロード
      setMessage("Driveにアップロード中...");
      const uploadRes = await fetch("/api/dispatch-sheet/upload-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64,
          fileName,
          dispatchType,
        }),
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => null);
        throw new Error(errData?.error || "Driveへのアップロードに失敗しました");
      }

      const result = await uploadRes.json();
      setDriveLink(result.webViewLink || "");
      setMessage(`PDF生成完了 → Driveに保存しました（${fileName}）`);

      // ローカルにもダウンロード
      pdf.save(fileName);
    } catch (e) {
      restore(); // エラー時も必ず復元
      console.error("PDF generation error:", e);
      setMessage(e instanceof Error ? e.message : "PDF生成に失敗しました");
    } finally {
      setPdfLoading(false);
    }
  }

  function handleClear() {
    setFormData({ ...emptyFormData });
    setLookupNo("");
    setMessage("");
    setDriveLink("");
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="no-print sticky top-0 z-50 h-16 px-4 md:px-8 flex items-center justify-between bg-navy-gradient text-white shadow-header">
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 bg-gold-gradient rounded-lg flex items-center justify-center text-lg font-extrabold text-navy">
            H
          </div>
          <div>
            <div className="text-sm font-bold tracking-widest font-serif">手配管理票</div>
            <div className="text-[10px] text-gray-400 tracking-wider">MANAGEMENT SHEET</div>
          </div>
        </a>
        <div className="flex items-center gap-3">
          <a href="/dispatch" className="text-xs text-gray-300 hover:text-white transition-colors">
            手配書管理へ →
          </a>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="no-print max-w-[1200px] mx-auto px-4 md:px-6 pt-5">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
          <a href="/" className="hover:text-gold transition-colors cursor-pointer">ホーム</a>
          <ChevronRight className="w-3 h-3" />
          <a href="/dispatch" className="hover:text-gold transition-colors cursor-pointer">手配書管理</a>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gold font-semibold">手配管理票</span>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-[1200px] mx-auto px-4 md:px-6 pb-12">
        {/* 操作バー */}
        <div className="no-print bg-white rounded-xl shadow-card p-4 mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold" />
              <span className="text-sm font-bold text-navy">データ取得</span>
            </div>

            <select
              value={dispatchType}
              onChange={e => setDispatchType(e.target.value as "BOJ" | "OTHER")}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              <option value="BOJ">BOJ様用</option>
              <option value="OTHER">その他</option>
            </select>

            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500">NO:</span>
              <Input
                value={lookupNo}
                onChange={e => setLookupNo(e.target.value)}
                placeholder="例: 5"
                className="w-24 h-9 text-sm"
                onKeyDown={e => e.key === "Enter" && handleLookup()}
              />
            </div>

            <Button
              onClick={handleLookup}
              disabled={loading}
              className="gap-1.5 h-9 bg-gold hover:bg-gold-light text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              実行
            </Button>

            <div className="h-6 w-px bg-gray-200 mx-1" />

            <Button
              onClick={handleGeneratePdf}
              disabled={pdfLoading}
              variant="outline"
              className="gap-1.5 h-9 text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {pdfLoading ? "生成中..." : "PDFにする"}
            </Button>

            <Button
              onClick={() => window.print()}
              variant="outline"
              className="gap-1.5 h-9"
              title="印刷プレビュー"
            >
              <Printer className="w-4 h-4" />
              印刷
            </Button>

            <Button
              onClick={handleClear}
              variant="outline"
              className="gap-1.5 h-9"
            >
              <RotateCcw className="w-4 h-4" />
              クリア
            </Button>
          </div>

          {/* メッセージ・Driveリンク */}
          {(message || driveLink) && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {message && (
                <span className={`text-xs ${message.includes("失敗") || message.includes("エラー") || message.includes("見つかりません") ? "text-red-600" : "text-green-600"}`}>
                  {message}
                </span>
              )}
              {driveLink && (
                <a
                  href={driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Driveで開く
                </a>
              )}
            </div>
          )}
        </div>

        {/* フォーム本体 */}
        <div ref={formRef} className="bg-white rounded-xl shadow-card p-4 md:p-6 overflow-x-auto print:shadow-none print:p-0 print:rounded-none">
          <ManagementSheetForm
            data={formData}
            onChange={handleChange}
            onArrayChange={handleArrayChange}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="no-print bg-navy-gradient text-center py-6 text-xs text-gray-500 tracking-wider">
        Premium Hire - Dispatch Management System
      </footer>
    </div>
  );
}
