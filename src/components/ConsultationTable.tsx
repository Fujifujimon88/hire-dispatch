"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import type { Consultation } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  MessageSquare, Pencil, Trash2, ArrowRightCircle,
} from "lucide-react";

const statusLabel: Record<string, string> = {
  CONSULTING: "相談中", ESTIMATING: "見積中", CONFIRMED: "確定済", CANCELLED: "キャンセル",
};
const statusColor: Record<string, string> = {
  CONSULTING: "bg-yellow-50 text-yellow-700",
  ESTIMATING: "bg-blue-50 text-blue-600",
  CONFIRMED: "bg-green-50 text-green-600",
  CANCELLED: "bg-red-50 text-red-600",
};

export function ConsultationTable({
  consultations, onEdit, onDelete, onConvert,
}: {
  consultations: Consultation[];
  onEdit: (c: Consultation) => void;
  onDelete: (id: string) => void;
  onConvert: (c: Consultation) => void;
}) {
  return (
    <Card className="overflow-hidden mt-8 animate-fade-in-up">
      <div className="p-4 md:p-5 border-b flex items-center gap-2.5">
        <MessageSquare className="w-5 h-5 text-gold" />
        <h3 className="font-bold font-serif text-navy text-[15px]">相談案件一覧</h3>
        <span className="text-xs text-gray-400 ml-2">{consultations.length} 件</span>
      </div>

      {consultations.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">相談案件がありません</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gold-50">
                <TableHead className="text-xs font-semibold">お客様名</TableHead>
                <TableHead className="text-xs font-semibold">連絡先</TableHead>
                <TableHead className="text-xs font-semibold">希望日時</TableHead>
                <TableHead className="text-xs font-semibold">相談内容</TableHead>
                <TableHead className="text-xs font-semibold">担当</TableHead>
                <TableHead className="text-xs font-semibold">ステータス</TableHead>
                <TableHead className="text-xs font-semibold">登録日</TableHead>
                <TableHead className="text-xs font-semibold text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultations.map(c => (
                <TableRow key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="text-sm font-semibold">{c.customerName}</TableCell>
                  <TableCell className="text-sm text-gray-600">{c.contactInfo || "-"}</TableCell>
                  <TableCell className="text-sm">
                    {c.preferredDatetime ? formatDate(c.preferredDatetime) : "-"}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 max-w-[200px] truncate">
                    {c.consultationDetails || "-"}
                  </TableCell>
                  <TableCell className="text-sm">{c.assignedTo || "-"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[c.status] || "bg-gray-100 text-gray-600"}`}>
                      {statusLabel[c.status] || c.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDate(c.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      {c.status === "CONFIRMED" && (
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => onConvert(c)}
                          title="確定案件に変換"
                          className="h-7 px-2 text-gold text-xs gap-1 hover:text-gold"
                        >
                          <ArrowRightCircle className="w-3.5 h-3.5" /> 変換
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => onEdit(c)} className="h-7 w-7 p-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm("この相談案件を削除しますか？")) onDelete(c.id); }} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
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
  );
}
