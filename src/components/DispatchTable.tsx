"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import type { Dispatch } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";
import {
  ClipboardList, Pencil, Trash2, Calendar, ArrowRight, History, X,
  Download, FileText, Mail, Loader2,
} from "lucide-react";

const statusLabel: Record<string, string> = {
  CONFIRMED: "確定", DISPATCHED: "配車済", COMPLETED: "完了", CANCELLED: "キャンセル",
};
const statusColor: Record<string, string> = {
  CONFIRMED: "bg-blue-50 text-blue-600",
  DISPATCHED: "bg-purple-50 text-purple-600",
  COMPLETED: "bg-green-50 text-green-600",
  CANCELLED: "bg-red-50 text-red-600",
};

const FIELD_LABELS: Record<string, string> = {
  personInCharge: "担当者",
  arrangementDate: "手配日",
  arrangementMonth: "手配月",
  pickupLocation: "お迎え場所",
  pickupTime: "お迎え時間",
  stopover: "経由地",
  dropoffLocation: "送り先",
  returnTime: "帰着時間",
  customerName: "お客様名",
  customerCount: "人数",
  customerContact: "連絡先",
  vehicleId: "車両ID",
  "vehicle.name": "車両",
  driverId: "ドライバーID",
  "driver.name": "ドライバー",
  notes: "備考",
  status: "ステータス",
  calendarEventId: "カレンダーID",
};

type LogEntry = {
  id: string;
  action: string;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  createdAt: string;
};

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "-";
  if (typeof val === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(val)) {
      const d = new Date(val);
      return d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
    }
    return val;
  }
  return String(val);
}

function getChanges(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  if (!before || !after) return [];
  const trackFields = [
    "personInCharge", "arrangementDate", "pickupLocation", "pickupTime",
    "stopover", "dropoffLocation", "returnTime", "customerName",
    "customerCount", "customerContact", "notes", "status",
  ];
  const changes: { field: string; before: string; after: string }[] = [];
  for (const key of trackFields) {
    const bv = formatValue(before[key]);
    const av = formatValue(after[key]);
    if (bv !== av) {
      changes.push({ field: FIELD_LABELS[key] || key, before: bv, after: av });
    }
  }
  // vehicle/driver name
  const bVehicle = (before.vehicle as Record<string, unknown>)?.name;
  const aVehicle = (after.vehicle as Record<string, unknown>)?.name;
  if (formatValue(bVehicle) !== formatValue(aVehicle)) {
    changes.push({ field: "車両", before: formatValue(bVehicle), after: formatValue(aVehicle) });
  }
  const bDriver = (before.driver as Record<string, unknown>)?.name;
  const aDriver = (after.driver as Record<string, unknown>)?.name;
  if (formatValue(bDriver) !== formatValue(aDriver)) {
    changes.push({ field: "ドライバー", before: formatValue(bDriver), after: formatValue(aDriver) });
  }
  return changes;
}

function LogModal({ dispatch, onClose }: { dispatch: Dispatch; onClose: () => void }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    fetch(`/api/dispatches/${dispatch.id}/logs`)
      .then(r => r.json())
      .then(data => { setLogs(data); setLoading(false); })
      .catch(() => setLoading(false));
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gold" />
            <h3 className="font-bold text-navy text-sm">変更履歴 - {dispatch.orderNumber}</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="overflow-y-auto max-h-[calc(80vh-60px)] p-4">
          {loading ? (
            <p className="text-center text-gray-400 py-8">読み込み中...</p>
          ) : logs.length === 0 ? (
            <p className="text-center text-gray-400 py-8">変更履歴がありません</p>
          ) : (
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      log.action === "CREATE" ? "bg-green-50 text-green-600" :
                      log.action === "UPDATE" ? "bg-blue-50 text-blue-600" :
                      "bg-red-50 text-red-600"
                    }`}>
                      {log.action === "CREATE" ? "新規作成" : log.action === "UPDATE" ? "更新" : "削除"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
                    </span>
                  </div>

                  {log.action === "CREATE" && log.afterData && (
                    <p className="text-xs text-gray-500">
                      お客様: {(log.afterData as Record<string, unknown>).customerName as string}
                      {" / "}
                      {(log.afterData as Record<string, unknown>).pickupLocation as string} → {(log.afterData as Record<string, unknown>).dropoffLocation as string}
                    </p>
                  )}

                  {log.action === "UPDATE" && (
                    <div className="space-y-1">
                      {getChanges(
                        log.beforeData as Record<string, unknown> | null,
                        log.afterData as Record<string, unknown> | null
                      ).map((c, i) => (
                        <div key={i} className="flex items-center text-xs gap-1">
                          <span className="font-semibold text-gray-600 min-w-[80px]">{c.field}:</span>
                          <span className="text-red-400 line-through">{c.before}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="text-blue-600 font-semibold">{c.after}</span>
                        </div>
                      ))}
                      {getChanges(
                        log.beforeData as Record<string, unknown> | null,
                        log.afterData as Record<string, unknown> | null
                      ).length === 0 && (
                        <p className="text-xs text-gray-400">変更内容なし（カレンダー更新のみ）</p>
                      )}
                    </div>
                  )}

                  {log.action === "DELETE" && log.beforeData && (
                    <p className="text-xs text-gray-500">
                      お客様: {(log.beforeData as Record<string, unknown>).customerName as string}
                      {" / "}
                      {(log.beforeData as Record<string, unknown>).pickupLocation as string} → {(log.beforeData as Record<string, unknown>).dropoffLocation as string}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotifyModal({ dispatch, onClose }: { dispatch: Dispatch; onClose: () => void }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");

  async function send(type: "internal" | "client" | "both") {
    setSending(true);
    setResult("");
    try {
      const res = await fetch(`/api/dispatches/${dispatch.id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "送信に失敗しました");
      }
      setResult("送信しました");
      setTimeout(onClose, 1500);
    } catch (e) {
      setResult(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gold" />
            <h3 className="font-bold text-navy text-sm">メール送信 - {dispatch.orderNumber}</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 space-y-3">
          {!dispatch.pdfFileId && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">PDFが未生成です。先にPDF生成してください。</p>
          )}
          <Button variant="outline" className="w-full justify-start gap-2" disabled={sending} onClick={() => send("internal")}>
            <Mail className="w-4 h-4" /> 社内通知（A）を送信
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2" disabled={sending} onClick={() => send("client")}>
            <Mail className="w-4 h-4" /> 顧客通知（B）を送信
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2" disabled={sending} onClick={() => send("both")}>
            <Mail className="w-4 h-4" /> 両方を送信
          </Button>
          {sending && <p className="text-xs text-gray-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> 送信中...</p>}
          {result && <p className={`text-xs ${result.includes("失敗") || result.includes("エラー") ? "text-red-600" : "text-green-600"}`}>{result}</p>}
        </div>
      </div>
    </div>
  );
}

export function DispatchTable({
  dispatches, onEdit, onDelete,
}: {
  dispatches: Dispatch[];
  onEdit: (d: Dispatch) => void;
  onDelete: (id: string) => void;
}) {
  const [logDispatch, setLogDispatch] = useState<Dispatch | null>(null);
  const [notifyDispatch, setNotifyDispatch] = useState<Dispatch | null>(null);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  async function handleGeneratePdf(d: Dispatch) {
    setPdfLoading(d.id);
    try {
      const res = await fetch(`/api/dispatches/${d.id}/generate-pdf`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "PDF生成に失敗しました");
      }
      alert("PDF生成が完了しました");
    } catch (e) {
      alert(e instanceof Error ? e.message : "PDF生成に失敗しました");
    } finally {
      setPdfLoading(null);
    }
  }

  return (
    <>
      <Card className="overflow-hidden mt-8 animate-fade-in-up">
        <div className="p-4 md:p-5 border-b flex items-center gap-2.5">
          <ClipboardList className="w-5 h-5 text-gold" />
          <h3 className="font-bold font-serif text-navy text-[15px]">手配書一覧</h3>
          <span className="text-xs text-gray-400 ml-2">{dispatches.length} 件</span>
        </div>

        {dispatches.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">手配書がありません</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gold-50">
                  <TableHead className="text-xs font-semibold">注文番号</TableHead>
                  <TableHead className="text-xs font-semibold">種別</TableHead>
                  <TableHead className="text-xs font-semibold">手配日</TableHead>
                  <TableHead className="text-xs font-semibold">お客様</TableHead>
                  <TableHead className="text-xs font-semibold">ルート</TableHead>
                  <TableHead className="text-xs font-semibold">時間</TableHead>
                  <TableHead className="text-xs font-semibold">車両</TableHead>
                  <TableHead className="text-xs font-semibold">担当</TableHead>
                  <TableHead className="text-xs font-semibold">ステータス</TableHead>
                  <TableHead className="text-xs font-semibold text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dispatches.map(d => (
                  <TableRow key={d.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-mono text-xs text-gold font-semibold">{d.orderNumber}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        d.dispatchType === "BOJ" ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-500"
                      }`}>
                        {d.dispatchType === "BOJ" ? "BOJ" : "その他"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(d.arrangementDate)}</TableCell>
                    <TableCell className="text-sm font-semibold">{d.customerName}</TableCell>
                    <TableCell className="text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        {d.pickupLocation} <ArrowRight className="w-3 h-3 text-gold shrink-0" /> {d.dropoffLocation}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{formatTime(d.pickupTime)}</TableCell>
                    <TableCell className="text-sm">{d.vehicle?.name || "-"}</TableCell>
                    <TableCell className="text-sm">{d.personInCharge}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[d.status] || "bg-gray-100 text-gray-600"}`}>
                        {statusLabel[d.status] || d.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setLogDispatch(d)} className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700" title="変更履歴">
                          <History className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(d)} className="h-7 w-7 p-0">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { if (confirm("この手配書を削除しますか？")) onDelete(d.id); }} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {logDispatch && (
        <LogModal dispatch={logDispatch} onClose={() => setLogDispatch(null)} />
      )}
      {notifyDispatch && (
        <NotifyModal dispatch={notifyDispatch} onClose={() => setNotifyDispatch(null)} />
      )}
    </>
  );
}
