"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";

type DispatchClient = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  mappingType: string;
  calendarId?: string | null;
  spreadsheetId?: string | null;
  driveFolderId?: string | null;
};

export function ClientManagement() {
  const [clients, setClients] = useState<DispatchClient[]>([]);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [mappingType, setMappingType] = useState("OTHER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch("/api/dispatch-clients");
      if (res.ok) setClients(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  async function handleAdd() {
    if (!slug.trim() || !name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/dispatch-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slug.trim(), name: name.trim(), mappingType }),
      });
      if (res.ok) {
        setSlug("");
        setName("");
        setMappingType("OTHER");
        loadClients();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `エラー (${res.status})`);
      }
    } catch {
      setError("通信エラーが発生しました");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("このクライアントを削除しますか？")) return;
    try {
      const res = await fetch(`/api/dispatch-clients/${id}`, { method: "DELETE" });
      if (res.ok) loadClients();
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      {/* Add Client Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            クライアント追加
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Slug（URLパス）</label>
              <Input
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="boj"
                className="w-40 bg-gray-50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">表示名</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="BOJ様"
                className="w-48 bg-gray-50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">マッピング</label>
              <select
                value={mappingType}
                onChange={e => setMappingType(e.target.value)}
                className="h-9 px-3 rounded-md border border-gray-200 text-sm bg-gray-50"
              >
                <option value="BOJ">BOJ</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <Button
              variant="gold"
              size="sm"
              onClick={handleAdd}
              disabled={saving || !slug.trim() || !name.trim()}
              className="h-9"
            >
              追加
            </Button>
          </div>
          {error && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client List */}
      <Card className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gold-50">
              <TableHead className="text-gray-600 font-semibold text-xs">Slug</TableHead>
              <TableHead className="text-gray-600 font-semibold text-xs">表示名</TableHead>
              <TableHead className="text-gray-600 font-semibold text-xs">マッピング</TableHead>
              <TableHead className="text-gray-600 font-semibold text-xs">URL</TableHead>
              <TableHead className="text-gray-600 font-semibold text-xs w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-400">
                  クライアントが登録されていません
                </TableCell>
              </TableRow>
            ) : (
              clients.map(c => (
                <TableRow key={c.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-mono text-sm">{c.slug}</TableCell>
                  <TableCell className="font-semibold">{c.name}</TableCell>
                  <TableCell className="text-xs text-gray-500">{c.mappingType}</TableCell>
                  <TableCell>
                    <a
                      href={`/${c.slug}`}
                      className="text-gold hover:underline text-sm"
                    >
                      /{c.slug}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(c.id)}
                      className="text-red-400 hover:text-red-600 h-7 w-7 p-0"
                    >
                      <span className="sr-only">削除</span>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
