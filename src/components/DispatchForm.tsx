"use client";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Vehicle, Dispatch, DispatchForm as DForm } from "@/lib/types";
import {
  FileText, MapPin, Users, Car, Mail,
  CalendarPlus, RotateCcw, Loader2, Copy,
} from "lucide-react";

const NOTIFY_INTERNAL_DEFAULT = process.env.NEXT_PUBLIC_NOTIFY_INTERNAL_DEFAULT || "";
const NOTIFY_CLIENT_DEFAULT = process.env.NEXT_PUBLIC_NOTIFY_CLIENT_DEFAULT || "";

const empty: DForm = {
  orderNumber: "", personInCharge: "", arrangementDate: "",
  pickupLocation: "", pickupTime: "", stopover: "", dropoffLocation: "", returnTime: "",
  vehicleCount: 1,
  customerName: "", customerCount: 1, customerContact: "",
  vehicleId: "", notes: "",
  dispatchType: "BOJ",
  budgetPriceTaxIncluded: "",
  priceComment: "",
  driverInfo: "",
  internalNotifyEmails: NOTIFY_INTERNAL_DEFAULT,
  clientNotifyEmails: NOTIFY_CLIENT_DEFAULT,
};

/** Generate time options every 15 minutes (00:00 ~ 23:45) */
function generateTimeOptions() {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      options.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return options;
}

function formatTimeLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "午前" : "午後";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${h12}:${String(m).padStart(2, "0")}`;
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4 mt-2">
      <div className="w-1 h-6 bg-gold-gradient rounded-full" />
      <span className="text-gold">{icon}</span>
      <h4 className="text-sm font-bold text-navy">{label}</h4>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-gray-500 mb-1.5 block">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer";

export function DispatchForm({
  vehicles, editItem, onSaved, onCancel, clientSlug,
}: {
  vehicles: Vehicle[];
  editItem: Dispatch | null;
  onSaved: () => void;
  onCancel: () => void;
  clientSlug?: string;
}) {
  const isInternal = !clientSlug;
  const [f, setF] = useState<DForm>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [lastSaved, setLastSaved] = useState<DForm | null>(null);

  const timeOptions = useMemo(() => generateTimeOptions(), []);

  useEffect(() => {
    if (editItem) {
      setF({
        orderNumber: editItem.orderNumber,
        personInCharge: editItem.personInCharge,
        arrangementDate: editItem.arrangementDate?.split("T")[0] || "",
        pickupLocation: editItem.pickupLocation,
        pickupTime: editItem.pickupTime ? new Date(editItem.pickupTime).toTimeString().slice(0, 5) : "",
        stopover: editItem.stopover || "",
        dropoffLocation: editItem.dropoffLocation,
        returnTime: editItem.returnTime ? new Date(editItem.returnTime).toTimeString().slice(0, 5) : "",
        vehicleCount: editItem.vehicleCount || 1,
        customerName: editItem.customerName,
        customerCount: editItem.customerCount || 1,
        customerContact: editItem.customerContact || "",
        vehicleId: editItem.vehicleId || "",
        notes: editItem.notes || "",
        dispatchType: editItem.dispatchType || "BOJ",
        budgetPriceTaxIncluded: editItem.budgetPriceTaxIncluded ? String(editItem.budgetPriceTaxIncluded) : "",
        priceComment: editItem.priceComment || "",
        driverInfo: editItem.driverInfo || "",
        internalNotifyEmails: editItem.internalNotifyEmails?.join(", ") || NOTIFY_INTERNAL_DEFAULT,
        clientNotifyEmails: editItem.clientNotifyEmails?.join(", ") || NOTIFY_CLIENT_DEFAULT,
      });
    } else {
      setF({ ...empty });
    }
  }, [editItem]);

  const set = (patch: Partial<DForm>) => setF(prev => ({ ...prev, ...patch }));

  async function handleSubmit() {
    setErr(""); setSuccess("");
    if (!f.orderNumber || !f.personInCharge || !f.arrangementDate || !f.pickupLocation || !f.pickupTime || !f.dropoffLocation || !f.customerName) {
      setErr("必須項目を入力してください"); return;
    }

    setSubmitting(true);
    try {
      // メールアドレスをカンマ区切り文字列から配列に変換
      const payload = {
        ...f,
        internalNotifyEmails: f.internalNotifyEmails ? f.internalNotifyEmails.split(",").map(s => s.trim()).filter(Boolean) : [],
        clientNotifyEmails: f.clientNotifyEmails ? f.clientNotifyEmails.split(",").map(s => s.trim()).filter(Boolean) : [],
        ...(clientSlug && { clientSlug }),
      };

      const url = editItem ? `/api/dispatches/${editItem.id}` : "/api/dispatches";
      const method = editItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("保存に失敗しました");
      const dispatch = await res.json();

      const results: string[] = [editItem ? "更新しました" : "保存しました"];

      // Google Calendar integration
      try {
        const calUrl = editItem ? "/api/calendar/update-event" : "/api/calendar/create-event";
        const calRes = await fetch(calUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dispatchId: dispatch.id }),
        });
        if (!calRes.ok) throw new Error("カレンダー登録に失敗");
        const calData = await calRes.json();
        results.push(calData.skipped ? "カレンダー登録済（重複スキップ）" : "カレンダー登録済");
      } catch (calError) {
        console.error("Calendar operation failed:", calError);
        results.push("カレンダー登録失敗");
      }

      // Spreadsheet sync
      try {
        const sheetRes = await fetch(`/api/dispatches/${dispatch.id}/sync-sheet`, { method: "POST" });
        if (!sheetRes.ok) throw new Error("スプレッドシート同期失敗");
        results.push("シート同期済");
      } catch (sheetError) {
        console.error("Sheet sync failed:", sheetError);
        results.push("シート同期失敗");
      }

      setSuccess(results.join(" / "));

      if (!editItem) {
        setLastSaved({ ...f });
        setF({ ...empty });
      }
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="overflow-hidden animate-fade-in-up">
      <div className="h-[3px] bg-[linear-gradient(90deg,#b8963e,#d4af5e,#b8963e)]" />
      <div className="p-5 md:p-7">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold font-serif text-navy">
            {editItem ? "手配書を編集" : isInternal ? "確定案件 - 新規手配書" : "確定案件 - 新規発注依頼"}
          </h3>
          {!editItem && lastSaved && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setF({ ...lastSaved }); setErr(""); setSuccess(""); }}
              className="gap-1.5 text-xs"
            >
              <Copy className="w-3.5 h-3.5" /> 前回の登録内容をコピー
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-6">必須項目 (<span className="text-red-500">*</span>) を入力してください</p>

        {/* 基本情報 */}
        <SectionHeader icon={<FileText className="w-4 h-4" />} label="基本情報" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <Field label="注文番号" required>
            <Input value={f.orderNumber} onChange={e => set({ orderNumber: e.target.value })} placeholder="JP26-0295" className="font-mono text-sm" />
          </Field>
          <Field label="担当者" required>
            <Input value={f.personInCharge} onChange={e => set({ personInCharge: e.target.value })} placeholder="担当者名" />
          </Field>
          <Field label="手配日" required>
            <Input type="date" value={f.arrangementDate} onChange={e => set({ arrangementDate: e.target.value })} />
          </Field>
          <Field label="クライアント">
            {!isInternal ? (
              <div className="flex h-10 items-center px-3 text-sm bg-gray-100 rounded-md border text-gray-600">{clientSlug?.toUpperCase()}（固定）</div>
            ) : (
              <select
                value={f.dispatchType}
                onChange={e => set({ dispatchType: e.target.value as "BOJ" | "OTHER" })}
                className={selectClass}
              >
                <option value="BOJ">BOJ</option>
                <option value="OTHER">その他</option>
              </select>
            )}
          </Field>
        </div>

        {/* 配車情報 */}
        <SectionHeader icon={<MapPin className="w-4 h-4" />} label="配車情報" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Field label="お迎え場所" required>
            <Input value={f.pickupLocation} onChange={e => set({ pickupLocation: e.target.value })} placeholder="住所・ホテル名・ランドマーク" />
          </Field>
          <Field label="お迎え時間" required>
            <select
              value={f.pickupTime}
              onChange={e => set({ pickupTime: e.target.value })}
              className={selectClass}
            >
              <option value="">-- 選択 --</option>
              {timeOptions.map(t => (
                <option key={t} value={t}>{formatTimeLabel(t)}</option>
              ))}
            </select>
          </Field>
          <Field label="立寄り">
            <Input value={f.stopover} onChange={e => set({ stopover: e.target.value })} placeholder="経由地（任意）" />
          </Field>
          <Field label="送り場所" required>
            <Input value={f.dropoffLocation} onChange={e => set({ dropoffLocation: e.target.value })} placeholder="住所・ホテル名・ランドマーク" />
          </Field>
          <Field label="帰着時間">
            <select
              value={f.returnTime}
              onChange={e => set({ returnTime: e.target.value })}
              className={selectClass}
            >
              <option value="">-- 選択 --</option>
              {timeOptions.map(t => (
                <option key={t} value={t}>{formatTimeLabel(t)}</option>
              ))}
            </select>
          </Field>
          <Field label="台数">
            <Input type="number" min={1} max={99} value={f.vehicleCount} onChange={e => set({ vehicleCount: +e.target.value })} />
          </Field>
        </div>

        {/* お客様情報 */}
        <SectionHeader icon={<Users className="w-4 h-4" />} label="お客様情報" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Field label="お客様" required>
            <Input value={f.customerName} onChange={e => set({ customerName: e.target.value })} placeholder="お客様名" />
          </Field>
          <Field label="人数">
            <Input type="number" min={1} max={20} value={f.customerCount} onChange={e => set({ customerCount: +e.target.value })} />
          </Field>
          <Field label="お客様連絡先">
            <Input value={f.customerContact} onChange={e => set({ customerContact: e.target.value })} placeholder="電話番号" />
          </Field>
        </div>

        {/* 車両 */}
        <SectionHeader icon={<Car className="w-4 h-4" />} label="車両" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="車両選択">
            <select
              value={f.vehicleId}
              onChange={e => set({ vehicleId: e.target.value })}
              className={selectClass}
            >
              <option value="">未選択</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} {v.plateNumber ? `(${v.plateNumber})` : ""} [{v.grade?.name}]
                </option>
              ))}
            </select>
          </Field>
          <Field label="車両番号・ドライバー・携帯">
            <Input value={f.driverInfo} onChange={e => set({ driverInfo: e.target.value })} placeholder="例: 品川300あ1234 / 田中 / 090-xxxx-xxxx" />
          </Field>
        </div>
        <div className="mb-8">
          <Field label="備考">
            <Textarea value={f.notes} onChange={e => set({ notes: e.target.value })} placeholder="備考・特記事項" rows={3} />
          </Field>
        </div>


        {/* メール通知設定 */}
        <SectionHeader icon={<Mail className="w-4 h-4" />} label="メール通知設定" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Field label="社内通知先（カンマ区切り）">
            <Textarea value={f.internalNotifyEmails} onChange={e => set({ internalNotifyEmails: e.target.value })} placeholder="user1@example.com, user2@example.com" rows={2} />
          </Field>
          <Field label="顧客通知先（カンマ区切り）">
            <Textarea value={f.clientNotifyEmails} onChange={e => set({ clientNotifyEmails: e.target.value })} placeholder="client@example.com" rows={2} />
          </Field>
        </div>

        {/* Messages */}
        {err && <div className="text-red-600 text-sm mb-3 flex items-center gap-1.5">{err}</div>}
        {success && <div className="text-green-600 text-sm mb-3 flex items-center gap-1.5">{success}</div>}

        {/* Actions */}
        <div className="flex gap-3 justify-end border-t pt-5">
          {editItem && (
            <Button variant="outline" onClick={onCancel} className="gap-1.5">
              <RotateCcw className="w-4 h-4" /> キャンセル
            </Button>
          )}
          <Button variant="outline" onClick={() => { setF({ ...empty }); setErr(""); setSuccess(""); }} className="gap-1.5">
            <RotateCcw className="w-4 h-4" /> クリア
          </Button>
          <Button variant="gold" onClick={handleSubmit} disabled={submitting} className="gap-1.5 px-6">
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 保存中...</>
            ) : (
              <><CalendarPlus className="w-4 h-4" /> {editItem ? "更新" : "保存してカレンダーに登録"}</>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
