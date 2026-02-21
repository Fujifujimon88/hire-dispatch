"use client";
import { useState, useEffect } from "react";
import { api, Reservation, SC, AI } from "@/lib/shared";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";

/* ═══════════════════════════════════════ */
/* ── ReservationListView ──               */
/* ═══════════════════════════════════════ */

export function ReservationListView({ t, lang, reservations, title, showUser }: { t: any; lang: string; reservations: Reservation[]; title: string; showUser: boolean }) {
  return (
    <div className="max-w-[900px] mx-auto py-10 px-5">
      {title && <h2 className="text-xl font-bold mb-6 font-serif">{title}</h2>}
      {reservations.length===0 ? <p className="text-gray-400 text-center py-10">No reservations</p> :
      <div className="grid gap-3">{reservations.map(r => (
        <Card key={r.id} className="p-4 px-5 grid grid-cols-[1fr_auto] gap-4 items-center">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="font-bold text-sm text-gold">{r.orderNumber}</span>
              <StatusBadge status={r.status}>{t[r.status?.toLowerCase()]||r.status}</StatusBadge>
            </div>
            <div className="text-sm text-gray-600">{r.pickupLocation} → {r.dropoffLocation}</div>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(r.pickupDatetime).toLocaleString(lang==="ja"?"ja-JP":"en-US")} | {r.vehicle?.name}
              {showUser && r.user && <span> | {r.user.name}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">¥{r.price.toLocaleString()}</div>
            {r.status==="COMPLETED" && (
              <Button variant="gold-outline" size="sm" className="mt-1.5 text-xs h-7" onClick={()=>window.open(`/api/reservations/${r.id}/receipt`,"_blank")}>
                📄 {t.receipt}
              </Button>
            )}
          </div>
        </Card>
      ))}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════ */
/* ── CRUD Helper: CrudTable ──            */
/* ═══════════════════════════════════════ */

export function CrudTable({ t, columns, rows, onEdit, onDelete }: { t: any; columns: { key: string; label: string; render?: (v: any) => React.ReactNode }[]; rows: any[]; onEdit: (item: any) => void; onDelete: (id: string) => void }) {
  return (
    <Card className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gold-50">
            {columns.map(c => <TableHead key={c.key} className="text-gray-600 font-semibold text-xs whitespace-nowrap">{c.label}</TableHead>)}
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={columns.length+1} className="text-center py-10 text-gray-400">No data</TableCell></TableRow>
          ) : rows.map((r, i) => (
            <TableRow key={r.id || i} className="hover:bg-gray-50/50">
              {columns.map(c => <TableCell key={c.key} className="text-sm">{c.render ? c.render(r) : r[c.key]}</TableCell>)}
              <TableCell className="text-right whitespace-nowrap">
                <Button variant="ghost" size="sm" className="text-gold hover:text-gold-light mr-1" onClick={() => onEdit(r)}>✏️ {t.edit}</Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => onDelete(r.id)}>🗑️ {t.deleteBtn}</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

/* ═══════════════════════════════════════ */
/* ── CRUD Form Wrapper ──                 */
/* ═══════════════════════════════════════ */

function CrudForm({ title, onCancel, onSave, t, children }: { title: string; onCancel: () => void; onSave: () => void; t: any; children: React.ReactNode }) {
  return (
    <Card className="p-7">
      <h3 className="text-base font-bold mb-5">{title}</h3>
      {children}
      <div className="flex gap-3 mt-6 justify-end">
        <Button variant="outline" onClick={onCancel}>{t.cancelBtn}</Button>
        <Button variant="gold" onClick={onSave}>{t.save}</Button>
      </div>
    </Card>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-500">{label}</Label>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════ */
/* ── CRUD: Vehicle ──                     */
/* ═══════════════════════════════════════ */

export function VehicleCrud({ t, vehicles, grades, onRefresh }: { t: any; vehicles: any[]; grades: any[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const emptyForm = { name: "", vehicleType: "SEDAN", gradeId: "", plateNumber: "", maxPassengers: 3, maxLuggage: 2, basePrice: 15000, imageUrl: "", amenities: [] as string[], isActive: true };
  const [form, setForm] = useState(emptyForm);
  const [gradeOpts, setGradeOpts] = useState<any[]>([]);

  useEffect(() => { api("/api/admin/grades").then(setGradeOpts).catch(()=>{}); }, []);

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ name: item.name, vehicleType: item.vehicleType, gradeId: item.gradeId || item.grade?.id || "", plateNumber: item.plateNumber||"", maxPassengers: item.maxPassengers, maxLuggage: item.maxLuggage, basePrice: item.basePrice, imageUrl: item.imageUrl||"", amenities: item.amenities||[], isActive: item.isActive??true });
    setShowForm(true);
  };
  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    await api(`/api/admin/vehicles/${id}`, { method: "DELETE" });
    onRefresh();
  };
  const handleSave = async () => {
    const body = { ...form, basePrice: Number(form.basePrice), maxPassengers: Number(form.maxPassengers), maxLuggage: Number(form.maxLuggage) };
    if (editItem) await api(`/api/admin/vehicles/${editItem.id}`, { method: "PUT", body: JSON.stringify(body) });
    else await api("/api/admin/vehicles", { method: "POST", body: JSON.stringify(body) });
    setShowForm(false);
    onRefresh();
  };
  const toggleAmenity = (a: string) => {
    setForm(f => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] }));
  };

  if (showForm) return (
    <CrudForm title={`${editItem ? t.edit : t.addNew} - ${t.vehicles}`} onCancel={() => setShowForm(false)} onSave={handleSave} t={t}>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t.name}><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-gray-50" /></FormField>
        <FormField label={t.vehicleTypeLabel}>
          <select value={form.vehicleType} onChange={e => setForm({...form, vehicleType: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gold/50">
            <option value="SEDAN">{t.sedan}</option><option value="MINIVAN">{t.minivan}</option><option value="LIMOUSINE">Limousine</option>
          </select>
        </FormField>
        <FormField label={t.grades}>
          <select value={form.gradeId} onChange={e => setForm({...form, gradeId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gold/50">
            <option value="">--</option>
            {gradeOpts.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </FormField>
        <FormField label={t.plateNumber}><Input value={form.plateNumber} onChange={e => setForm({...form, plateNumber: e.target.value})} className="bg-gray-50" /></FormField>
        <FormField label={t.maxPassengersLabel}><Input type="number" value={form.maxPassengers} onChange={e => setForm({...form, maxPassengers: +e.target.value})} className="bg-gray-50" /></FormField>
        <FormField label={t.maxLuggageLabel}><Input type="number" value={form.maxLuggage} onChange={e => setForm({...form, maxLuggage: +e.target.value})} className="bg-gray-50" /></FormField>
        <FormField label={`${t.basePriceLabel} (¥)`}><Input type="number" value={form.basePrice} onChange={e => setForm({...form, basePrice: +e.target.value})} className="bg-gray-50" /></FormField>
        <FormField label={t.imageUrlLabel}><Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="bg-gray-50" /></FormField>
      </div>
      <div className="mt-4">
        <Label className="text-xs font-semibold text-gray-500 mb-2 block">{t.amenitiesLabel}</Label>
        <div className="flex gap-4">
          {["TV","Wi-Fi","USB","Bluetooth"].map(a => (
            <label key={a} className="flex items-center gap-1.5 cursor-pointer text-sm">
              <input type="checkbox" checked={form.amenities.includes(a)} onChange={() => toggleAmenity(a)} className="rounded" /> {AI[a]} {a}
            </label>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="rounded" /> {t.activeLabel}
        </label>
      </div>
    </CrudForm>
  );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="gold" size="sm" onClick={openCreate}>+ {t.addNew}</Button>
      </div>
      <CrudTable t={t} columns={[
        { key: "name", label: t.name, render: (r: any) => <span className="font-semibold">{r.name}</span> },
        { key: "vehicleType", label: t.vehicleTypeLabel },
        { key: "grade", label: t.grades, render: (r: any) => r.grade?.name || "-" },
        { key: "maxPassengers", label: "👤" },
        { key: "maxLuggage", label: "🧳" },
        { key: "basePrice", label: t.basePriceLabel, render: (r: any) => <span className="font-semibold text-gold">¥{r.basePrice?.toLocaleString()}</span> },
        { key: "amenities", label: t.amenitiesLabel, render: (r: any) => (r.amenities||[]).join(", ") },
        { key: "isActive", label: "Status", render: (r: any) => <StatusBadge status={r.isActive ? "COMPLETED" : "CANCELLED"} className={r.isActive ? "bg-status-completed/10 text-status-completed" : "bg-status-cancelled/10 text-status-cancelled"}>{r.isActive ? t.activeLabel : t.inactiveLabel}</StatusBadge> },
      ]} rows={vehicles} onEdit={openEdit} onDelete={handleDelete} />
    </div>
  );
}

/* ═══════════════════════════════════════ */
/* ── CRUD: Grade ──                       */
/* ═══════════════════════════════════════ */

export function GradeCrud({ t, grades, onRefresh }: { t: any; grades: any[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const emptyForm = { name: "", slug: "", description: "", sortOrder: 0 };
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (item: any) => { setEditItem(item); setForm({ name: item.name, slug: item.slug, description: item.description||"", sortOrder: item.sortOrder }); setShowForm(true); };
  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    try { await api(`/api/admin/grades/${id}`, { method: "DELETE" }); onRefresh(); } catch (e: any) { alert(e.message); }
  };
  const handleSave = async () => {
    const body = { ...form, sortOrder: Number(form.sortOrder) };
    if (editItem) await api(`/api/admin/grades/${editItem.id}`, { method: "PUT", body: JSON.stringify(body) });
    else await api("/api/admin/grades", { method: "POST", body: JSON.stringify(body) });
    setShowForm(false); onRefresh();
  };

  if (showForm) return (
    <CrudForm title={`${editItem ? t.edit : t.addNew} - ${t.grades}`} onCancel={() => setShowForm(false)} onSave={handleSave} t={t}>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t.name}><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-gray-50" /></FormField>
        <FormField label={t.slugLabel}><Input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="bg-gray-50" /></FormField>
        <FormField label={t.descriptionLabel}><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-gray-50" /></FormField>
        <FormField label={t.sortOrderLabel}><Input type="number" value={form.sortOrder} onChange={e => setForm({...form, sortOrder: +e.target.value})} className="bg-gray-50" /></FormField>
      </div>
    </CrudForm>
  );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="gold" size="sm" onClick={openCreate}>+ {t.addNew}</Button>
      </div>
      <CrudTable t={t} columns={[
        { key: "name", label: t.name, render: (r: any) => <span className="font-semibold">{r.name}</span> },
        { key: "slug", label: t.slugLabel },
        { key: "description", label: t.descriptionLabel },
        { key: "sortOrder", label: t.sortOrderLabel },
      ]} rows={grades} onEdit={openEdit} onDelete={handleDelete} />
    </div>
  );
}

/* ═══════════════════════════════════════ */
/* ── CRUD: Driver ──                      */
/* ═══════════════════════════════════════ */

export function DriverCrud({ t, drivers, onRefresh }: { t: any; drivers: any[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [scheduleDriver, setScheduleDriver] = useState<any>(null);
  const emptyForm = { name: "", phone: "", licenseNumber: "", languages: ["ja"] as string[], isActive: true };
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (item: any) => { setEditItem(item); setForm({ name: item.name, phone: item.phone||"", licenseNumber: item.licenseNumber||"", languages: item.languages||["ja"], isActive: item.isActive??true }); setShowForm(true); };
  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    await api(`/api/admin/drivers/${id}`, { method: "DELETE" }); onRefresh();
  };
  const handleSave = async () => {
    if (editItem) await api(`/api/admin/drivers/${editItem.id}`, { method: "PUT", body: JSON.stringify(form) });
    else await api("/api/admin/drivers", { method: "POST", body: JSON.stringify(form) });
    setShowForm(false); onRefresh();
  };
  const toggleLang = (l: string) => {
    setForm(f => ({ ...f, languages: f.languages.includes(l) ? f.languages.filter(x => x !== l) : [...f.languages, l] }));
  };

  if (scheduleDriver) return <DriverSchedule t={t} driver={scheduleDriver} onBack={() => setScheduleDriver(null)} />;

  if (showForm) return (
    <CrudForm title={`${editItem ? t.edit : t.addNew} - ${t.driversTab}`} onCancel={() => setShowForm(false)} onSave={handleSave} t={t}>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t.name}><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-gray-50" /></FormField>
        <FormField label={t.phone}><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="bg-gray-50" /></FormField>
        <FormField label={t.licenseNumberLabel}><Input value={form.licenseNumber} onChange={e => setForm({...form, licenseNumber: e.target.value})} className="bg-gray-50" /></FormField>
      </div>
      <div className="mt-4">
        <Label className="text-xs font-semibold text-gray-500 mb-2 block">{t.languagesLabel}</Label>
        <div className="flex gap-4">
          {[["ja","日本語"],["en","English"],["zh","中文"],["ko","한국어"]].map(([code,label]) => (
            <label key={code} className="flex items-center gap-1.5 cursor-pointer text-sm">
              <input type="checkbox" checked={form.languages.includes(code)} onChange={() => toggleLang(code)} className="rounded" /> {label}
            </label>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="rounded" /> {t.activeLabel}
        </label>
      </div>
    </CrudForm>
  );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="gold" size="sm" onClick={openCreate}>+ {t.addNew}</Button>
      </div>
      <CrudTable t={t} columns={[
        { key: "name", label: t.name, render: (r: any) => <span className="font-semibold">{r.name}</span> },
        { key: "phone", label: t.phone },
        { key: "licenseNumber", label: t.licenseNumberLabel },
        { key: "languages", label: t.languagesLabel, render: (r: any) => (r.languages||[]).join(", ") },
        { key: "isActive", label: "Status", render: (r: any) => <StatusBadge status={r.isActive ? "COMPLETED" : "CANCELLED"} className={r.isActive ? "bg-status-completed/10 text-status-completed" : "bg-status-cancelled/10 text-status-cancelled"}>{r.isActive ? t.activeLabel : t.inactiveLabel}</StatusBadge> },
        { key: "schedule", label: t.scheduleBtn, render: (r: any) => <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600 font-semibold" onClick={(e) => { e.stopPropagation(); setScheduleDriver(r); }}>📅 {t.scheduleBtn}</Button> },
      ]} rows={drivers} onEdit={openEdit} onDelete={handleDelete} />
    </div>
  );
}

/* ═══════════════════════════════════════ */
/* ── DriverSchedule ──                    */
/* ═══════════════════════════════════════ */

function DriverSchedule({ t, driver, onBack }: { t: any; driver: any; onBack: () => void }) {
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fmtDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDates.push(d);
  }

  const timeSlots: string[] = [];
  for (let h = 10; h <= 20; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 20 && m > 30) break;
      timeSlots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }

  useEffect(() => {
    const from = fmtDate(weekDates[0]);
    const to = fmtDate(weekDates[6]);
    api(`/api/admin/drivers/${driver.id}/availability?from=${from}&to=${to}`)
      .then(setAvailability)
      .catch(() => setAvailability({}));
  }, [weekStart, driver.id]);

  const toggleSlot = (dateStr: string, slot: string) => {
    setAvailability(prev => {
      const slots = prev[dateStr] || [];
      const newSlots = slots.includes(slot) ? slots.filter(s => s !== slot) : [...slots, slot].sort();
      return { ...prev, [dateStr]: newSlots };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string[]> = {};
      for (const d of weekDates) payload[fmtDate(d)] = availability[fmtDate(d)] || [];
      await api(`/api/admin/drivers/${driver.id}/availability`, { method: "PUT", body: JSON.stringify(payload) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };
  const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  const todayStr = fmtDate(new Date());

  return (
    <div>
      <div className="flex items-center gap-4 mb-5">
        <Button variant="ghost" size="sm" className="text-gold font-semibold" onClick={onBack}>← {t.backToList}</Button>
        <h3 className="text-base font-bold font-serif">{t.availabilityTitle} - {driver.name}</h3>
      </div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="gold" size="sm" onClick={prevWeek}>← {t.prevWeek}</Button>
          <span className="text-base font-bold text-navy min-w-[100px] text-center">{weekStart.getFullYear()}/{weekStart.getMonth() + 1}</span>
          <Button variant="gold" size="sm" onClick={nextWeek}>{t.nextWeek} →</Button>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-status-completed text-sm font-semibold">{t.scheduleSaved}</span>}
          <Button variant="gold" onClick={handleSave} disabled={saving} className={saving ? "opacity-60" : ""}>{saving ? t.savingSchedule : t.save}</Button>
        </div>
      </div>
      <div className="flex gap-4 mb-3 text-sm text-gray-600">
        <span className="text-red-600">◎ = {t.available}</span>
        <span className="text-gray-400">× = {t.unavailable}</span>
      </div>
      <Card className="overflow-auto">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gold-50">
              <th className="sticky left-0 bg-gold-50 z-[2] min-w-[60px] text-center p-3 text-xs font-semibold text-gray-600 border-b border-gray-200">{t.time}</th>
              {weekDates.map((d, i) => {
                const ds = fmtDate(d);
                const isToday = todayStr === ds;
                const isSat = d.getDay() === 6;
                const isSun = d.getDay() === 0;
                return (
                  <th key={ds} className={cn(
                    "text-center min-w-[80px] p-3 border-b border-gray-200",
                    isToday ? "bg-gold-100" : isSat ? "bg-blue-50" : isSun ? "bg-red-50" : "bg-gold-50",
                    isSun ? "text-red-500" : isSat ? "text-blue-500" : "text-gray-600"
                  )}>
                    <div className="text-[11px]">{d.getMonth() + 1}/{d.getDate()}</div>
                    <div className="text-sm font-bold">{t[dayKeys[i]]}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(slot => {
              const isHour = slot.endsWith(":00");
              return (
                <tr key={slot} className={isHour ? "border-b border-gray-300" : "border-b border-gray-100"}>
                  <td className={cn(
                    "sticky left-0 bg-white z-[1] border-r border-gray-200 text-center whitespace-nowrap px-2 py-1",
                    isHour ? "font-bold text-sm text-gray-800" : "text-[11px] text-gray-400"
                  )}>
                    {slot}
                  </td>
                  {weekDates.map(d => {
                    const ds = fmtDate(d);
                    const isAvail = (availability[ds] || []).includes(slot);
                    return (
                      <td key={ds} onClick={() => toggleSlot(ds, slot)} className={cn(
                        "text-center cursor-pointer text-base select-none transition-colors px-2 py-1",
                        isAvail
                          ? "text-red-600 bg-red-600/[0.03] hover:bg-red-600/10"
                          : "text-gray-300 hover:bg-gray-100"
                      )}>
                        {isAvail ? "◎" : "×"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════ */
/* ── CRUD: Location ──                    */
/* ═══════════════════════════════════════ */

export function LocationCrud({ t, locations, onRefresh }: { t: any; locations: any[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const emptyForm = { name: "", address: "", category: "station", sortOrder: 0, isActive: true };
  const [form, setForm] = useState(emptyForm);

  const catLabels: Record<string, string> = { airport: t.airportCat, hotel: t.hotelCat, station: t.stationCat, landmark: t.landmarkCat, other: t.otherCat };

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (item: any) => { setEditItem(item); setForm({ name: item.name, address: item.address||"", category: item.category||"other", sortOrder: item.sortOrder, isActive: item.isActive??true }); setShowForm(true); };
  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    await api(`/api/admin/locations/${id}`, { method: "DELETE" }); onRefresh();
  };
  const handleSave = async () => {
    const body = { ...form, sortOrder: Number(form.sortOrder) };
    if (editItem) await api(`/api/admin/locations/${editItem.id}`, { method: "PUT", body: JSON.stringify(body) });
    else await api("/api/admin/locations", { method: "POST", body: JSON.stringify(body) });
    setShowForm(false); onRefresh();
  };

  if (showForm) return (
    <CrudForm title={`${editItem ? t.edit : t.addNew} - ${t.locationsTab}`} onCancel={() => setShowForm(false)} onSave={handleSave} t={t}>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t.name}><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-gray-50" /></FormField>
        <FormField label={t.category}>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gold/50">
            {Object.entries(catLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </FormField>
        <div className="col-span-2">
          <FormField label={t.addressLabel}><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="bg-gray-50" /></FormField>
        </div>
        <FormField label={t.sortOrderLabel}><Input type="number" value={form.sortOrder} onChange={e => setForm({...form, sortOrder: +e.target.value})} className="bg-gray-50" /></FormField>
      </div>
      <div className="mt-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="rounded" /> {t.activeLabel}
        </label>
      </div>
    </CrudForm>
  );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="gold" size="sm" onClick={openCreate}>+ {t.addNew}</Button>
      </div>
      <CrudTable t={t} columns={[
        { key: "name", label: t.name, render: (r: any) => <span className="font-semibold">{r.name}</span> },
        { key: "address", label: t.addressLabel },
        { key: "category", label: t.category, render: (r: any) => catLabels[r.category] || r.category },
        { key: "sortOrder", label: t.sortOrderLabel },
        { key: "isActive", label: "Status", render: (r: any) => <StatusBadge status={r.isActive ? "COMPLETED" : "CANCELLED"} className={r.isActive ? "bg-status-completed/10 text-status-completed" : "bg-status-cancelled/10 text-status-cancelled"}>{r.isActive ? t.activeLabel : t.inactiveLabel}</StatusBadge> },
      ]} rows={locations} onEdit={openEdit} onDelete={handleDelete} />
    </div>
  );
}
