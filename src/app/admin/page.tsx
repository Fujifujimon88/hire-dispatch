"use client";
import { useState, useEffect } from "react";
import { translations, Lang } from "@/lib/i18n";
import { api, Reservation, User } from "@/lib/shared";
import { cn } from "@/lib/utils";
import { VehicleCrud, GradeCrud, DriverCrud, LocationCrud } from "@/components/CrudComponents";
import { ClientManagement } from "@/components/ClientManagement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";

export default function AdminPage() {
  const [lang, setLang] = useState<Lang>("ja");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const t = translations[lang];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api("/api/auth/me").then(u => { setUser(u); setLoading(false); }).catch(() => { localStorage.removeItem("token"); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => { localStorage.removeItem("token"); setUser(null); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-pulse text-gray-400 text-sm">Loading...</div>
    </div>
  );

  if (!user || (user.role !== "ADMIN" && user.role !== "CORPORATE_ADMIN")) {
    return <LoginGate t={t} lang={lang} setLang={setLang} title={t.admin} requiredRoles={["ADMIN", "CORPORATE_ADMIN"]} onLogin={setUser} currentUser={user} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-50 h-16 px-8 flex items-center justify-between bg-navy-gradient text-white shadow-header">
        <div className="flex items-center gap-4">
          <a href="/" className="w-9 h-9 bg-gold-gradient rounded-lg flex items-center justify-center text-lg font-extrabold text-navy hover:opacity-80 transition-opacity">H</a>
          <div className="text-base font-bold tracking-widest font-serif">{t.admin}</div>
        </div>
        <div className="flex items-center gap-3">
          <LangSwitcher lang={lang} setLang={setLang} />
          <span className="text-xs text-gray-400">{user.name}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-400 hover:text-white">{t.logout}</Button>
        </div>
      </header>

      <AdminViewContent t={t} lang={lang} user={user} />

      <footer className="bg-navy text-gray-600 text-center py-5 mt-16 text-xs">
        &copy; 2026 Premium Hire Service. All rights reserved.
      </footer>
    </div>
  );
}

function LangSwitcher({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex gap-0.5">
      {(["ja","en","zh","ko"] as Lang[]).map(l => (
        <button key={l} onClick={() => setLang(l)} className={cn(
          "px-2.5 py-1 text-xs border-none cursor-pointer rounded",
          lang === l ? "bg-gold text-white font-bold" : "bg-transparent text-gray-400 hover:text-gray-200"
        )}>
          {l==="ja"?"日本語":l==="en"?"EN":l==="zh"?"中文":"한국어"}
        </button>
      ))}
    </div>
  );
}

function LoginGate({ t, lang, setLang, title, requiredRoles, onLogin, currentUser }: { t: any; lang: Lang; setLang: (l: Lang) => void; title: string; requiredRoles: string[]; onLogin: (u: User) => void; currentUser: User | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    try {
      const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      localStorage.setItem("token", data.token);
      if (requiredRoles.includes(data.user.role)) {
        onLogin(data.user);
      } else {
        setErr("Access denied. Required role not met.");
      }
    } catch (e: any) { setErr(e.message || "Login failed"); }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="h-16 px-8 flex items-center justify-between bg-navy-gradient text-white shadow-header">
        <div className="flex items-center gap-4">
          <a href="/" className="w-9 h-9 bg-gold-gradient rounded-lg flex items-center justify-center text-lg font-extrabold text-navy hover:opacity-80 transition-opacity">H</a>
          <div className="text-base font-bold tracking-widest font-serif">{title}</div>
        </div>
        <LangSwitcher lang={lang} setLang={setLang} />
      </header>
      <div className="max-w-sm mx-auto pt-20 px-5">
        {currentUser && !requiredRoles.includes(currentUser.role) && (
          <div className="bg-red-500/10 text-red-600 px-4 py-3 rounded-lg mb-5 text-sm font-semibold">
            Access denied. Please login with an authorized account.
          </div>
        )}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-center font-serif text-lg">{t.login}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-500">{t.email}</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" className="bg-gray-50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-500">{t.password}</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password123" className="bg-gray-50" />
            </div>
            {err && <div className="text-red-600 text-sm">{err}</div>}
            <Button variant="gold" className="w-full py-3 text-base" onClick={submit}>{t.login}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminViewContent({ t, lang, user }: { t: any; lang: string; user: User }) {
  const [tab, setTab] = useState("res");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  const loadReservations = () => api("/api/admin/reservations").then(setReservations).catch(()=>{});
  const loadVehicles = () => api("/api/admin/vehicles").then(setVehicles).catch(()=>{});
  const loadGrades = () => api("/api/admin/grades").then(setGrades).catch(()=>{});
  const loadDrivers = () => api("/api/admin/drivers").then(setDrivers).catch(()=>{});
  const loadLocations = () => api("/api/admin/locations").then(setLocations).catch(()=>{});

  useEffect(() => {
    if (tab==="res") loadReservations();
    if (tab==="veh") loadVehicles();
    if (tab==="grd") loadGrades();
    if (tab==="drv") loadDrivers();
    if (tab==="loc") loadLocations();
    if (tab==="inv") api("/api/admin/invoices").then(setInvoices).catch(()=>{});
  }, [tab]);

  const updateStatus = async (id: string, status: string) => {
    await api(`/api/admin/reservations/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    loadReservations();
  };

  const issueInvoice = async (id: string) => {
    try {
      await api(`/api/admin/reservations/${id}/invoice`, { method: "POST" });
      loadReservations();
    } catch (e: any) { alert(e.message || "Failed to issue invoice"); }
  };

  const tabs = [["res",t.reservations],["veh",t.vehicles],["grd",t.grades],["drv",t.driversTab],["loc",t.locationsTab],["inv",t.invoices],["cli","クライアント"]];

  return (
    <div className="max-w-[1100px] mx-auto py-8 px-5">
      <div className="flex gap-1 mb-6 border-b-2 border-gray-200 flex-wrap">
        {tabs.map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k as string)} className={cn(
            "px-5 py-2.5 border-none cursor-pointer text-sm font-semibold transition-colors -mb-[2px]",
            tab===k ? "bg-white text-gold border-b-2 border-gold" : "bg-transparent text-gray-400 hover:text-gray-600 border-b-2 border-transparent"
          )}>{l}</button>
        ))}
      </div>

      {tab==="res" && (
        <Card className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gold-50">
                {[t.orderNumber,"User",t.route,t.dateTime,t.vehicle,t.price,"Status",t.invoices].map((h: string) =>
                  <TableHead key={h} className="text-gray-600 font-semibold text-xs whitespace-nowrap">{h}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map(r => (
                <TableRow key={r.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-semibold text-gold whitespace-nowrap">{r.orderNumber}</TableCell>
                  <TableCell>{r.user?.name||"-"}</TableCell>
                  <TableCell className="max-w-[200px] overflow-hidden text-ellipsis">{r.pickupLocation} → {r.dropoffLocation}</TableCell>
                  <TableCell className="whitespace-nowrap">{new Date(r.pickupDatetime).toLocaleString(lang==="ja"?"ja-JP":"en-US")}</TableCell>
                  <TableCell>{r.vehicle?.name}</TableCell>
                  <TableCell className="font-semibold">¥{r.price.toLocaleString()}</TableCell>
                  <TableCell>
                    <select value={r.status} onChange={e=>updateStatus(r.id,e.target.value)} className="px-2 py-1 rounded border border-gray-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-gold/50">
                      {["PENDING","CONFIRMED","DISPATCHED","COMPLETED","CANCELLED"].map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </TableCell>
                  <TableCell>
                    {(r as any).invoiceItems?.length > 0
                      ? <StatusBadge status="COMPLETED" className="bg-status-completed/10 text-status-completed">{(r as any).invoiceItems[0].invoice.invoiceNumber}</StatusBadge>
                      : r.status === "CANCELLED"
                        ? <span className="text-gray-400 text-xs">-</span>
                        : <Button variant="gold-outline" size="sm" className="text-xs h-7" onClick={() => issueInvoice(r.id)}>{t.issueInvoice || "発行"}</Button>
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {tab==="veh" && <VehicleCrud t={t} vehicles={vehicles} grades={grades} onRefresh={loadVehicles} />}
      {tab==="grd" && <GradeCrud t={t} grades={grades} onRefresh={loadGrades} />}
      {tab==="drv" && <DriverCrud t={t} drivers={drivers} onRefresh={loadDrivers} />}
      {tab==="loc" && <LocationCrud t={t} locations={locations} onRefresh={loadLocations} />}

      {tab==="cli" && <ClientManagement />}

      {tab==="inv" && (
        <Card className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gold-50">
                {["Invoice #","Company","Period","Total","Status"].map(h =>
                  <TableHead key={h} className="text-gray-600 font-semibold text-xs">{h}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length===0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-400">No invoices yet</TableCell></TableRow>
              ) : invoices.map((inv: any) => (
                <TableRow key={inv.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-semibold text-gold">{inv.invoiceNumber}</TableCell>
                  <TableCell>{inv.company?.name}</TableCell>
                  <TableCell>{new Date(inv.billingPeriodStart).toLocaleDateString()} - {new Date(inv.billingPeriodEnd).toLocaleDateString()}</TableCell>
                  <TableCell className="font-semibold">¥{inv.total.toLocaleString()}</TableCell>
                  <TableCell><StatusBadge status={inv.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
