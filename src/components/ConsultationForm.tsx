"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Consultation, ConsultationForm as CForm } from "@/lib/types";
import { Save, RotateCcw, Loader2 } from "lucide-react";

const emptyForm: CForm = {
  customerName: "", contactInfo: "", preferredDatetime: "",
  consultationDetails: "", status: "CONSULTING", assignedTo: "", notes: "",
};

const statusOptions = [
  { value: "CONSULTING", label: "相談中" },
  { value: "ESTIMATING", label: "見積中" },
  { value: "CONFIRMED", label: "確定済" },
  { value: "CANCELLED", label: "キャンセル" },
];

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

export function ConsultationForm({
  editItem, onSaved, onCancel,
}: {
  editItem: Consultation | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState<CForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (editItem) {
      setF({
        customerName: editItem.customerName,
        contactInfo: editItem.contactInfo || "",
        preferredDatetime: editItem.preferredDatetime ? editItem.preferredDatetime.slice(0, 16) : "",
        consultationDetails: editItem.consultationDetails || "",
        status: editItem.status,
        assignedTo: editItem.assignedTo || "",
        notes: editItem.notes || "",
      });
    } else {
      setF(emptyForm);
    }
  }, [editItem]);

  const set = (patch: Partial<CForm>) => setF(prev => ({ ...prev, ...patch }));

  async function handleSubmit() {
    setErr(""); setSuccess("");
    if (!f.customerName) { setErr("お客様名は必須です"); return; }

    setSubmitting(true);
    try {
      const url = editItem ? `/api/consultations/${editItem.id}` : "/api/consultations";
      const method = editItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      if (!res.ok) throw new Error("保存に失敗しました");

      setSuccess(editItem ? "更新しました" : "保存しました");
      if (!editItem) setF(emptyForm);
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
        <h3 className="text-lg font-bold font-serif text-navy mb-1">
          {editItem ? "相談案件を編集" : "相談案件 - 新規登録"}
        </h3>
        <p className="text-xs text-gray-400 mb-6">案件が未確定の場合はこちらに登録してください</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Field label="お客様名" required>
            <Input value={f.customerName} onChange={e => set({ customerName: e.target.value })} placeholder="お客様名" />
          </Field>
          <Field label="連絡先">
            <Input value={f.contactInfo} onChange={e => set({ contactInfo: e.target.value })} placeholder="電話番号・メール" />
          </Field>
          <Field label="希望日時">
            <Input type="datetime-local" value={f.preferredDatetime} onChange={e => set({ preferredDatetime: e.target.value })} />
          </Field>
          <Field label="ステータス">
            <select
              value={f.status}
              onChange={e => set({ status: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              {statusOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="担当者">
            <Input value={f.assignedTo} onChange={e => set({ assignedTo: e.target.value })} placeholder="対応担当者" />
          </Field>
        </div>

        <div className="mb-4">
          <Field label="相談内容">
            <Textarea value={f.consultationDetails} onChange={e => set({ consultationDetails: e.target.value })} placeholder="相談の詳細内容" rows={4} />
          </Field>
        </div>

        <div className="mb-6">
          <Field label="備考">
            <Textarea value={f.notes} onChange={e => set({ notes: e.target.value })} placeholder="メモ・備考" rows={2} />
          </Field>
        </div>

        {err && <div className="text-red-600 text-sm mb-3">{err}</div>}
        {success && <div className="text-green-600 text-sm mb-3">{success}</div>}

        <div className="flex gap-3 justify-end border-t pt-5">
          {editItem && (
            <Button variant="outline" onClick={onCancel} className="gap-1.5">
              <RotateCcw className="w-4 h-4" /> キャンセル
            </Button>
          )}
          <Button variant="outline" onClick={() => { setF(emptyForm); setErr(""); setSuccess(""); }} className="gap-1.5">
            <RotateCcw className="w-4 h-4" /> クリア
          </Button>
          <Button variant="gold" onClick={handleSubmit} disabled={submitting} className="gap-1.5 px-6">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> 保存中...</> : <><Save className="w-4 h-4" /> 保存</>}
          </Button>
        </div>
      </div>
    </Card>
  );
}
