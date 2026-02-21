"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { translations, Lang } from "@/lib/i18n";
import { api, Vehicle, Reservation, User, SC } from "@/lib/shared";
import { ReservationListView } from "@/components/CrudComponents";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  MapPin, Calendar, Clock, Users, Briefcase, Search, Car, CheckCircle2,
  FileText, Lock, ClipboardList, History, Crown, Tv, Wifi, PlugZap,
  Bluetooth, Sparkles, ChevronRight, Menu, X, LogOut, User as UserIcon,
  ArrowLeft, Plus, Minus, Shield, Phone, Mail, Eye, Loader2,
} from "lucide-react";

type SearchForm = { pickup: string; dropoff: string; date: string; time: string; adults: number; luggage: number };
type LocationItem = { id: string; name: string; address: string | null; category: string | null };

/* ── Amenity Icon Map ── */
const AmenityIcon: Record<string, React.ReactNode> = {
  TV: <Tv className="w-3.5 h-3.5" />,
  "Wi-Fi": <Wifi className="w-3.5 h-3.5" />,
  USB: <PlugZap className="w-3.5 h-3.5" />,
  Bluetooth: <Bluetooth className="w-3.5 h-3.5" />,
};

/* ── Grade Icon Map ── */
const GradeIcon: Record<string, React.ReactNode> = {
  standard: <Car className="w-4 h-4" />,
  premium: <Car className="w-4 h-4" />,
  vip: <Crown className="w-4 h-4" />,
};

/* ── Skeleton Component ── */
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-md animate-shimmer", className)} />;
}

/* ── Vehicle Card Skeleton ── */
function VehicleCardSkeleton() {
  return (
    <div className="bg-navy rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr] border border-[#2a2a4e]">
      <Skeleton className="min-h-[180px] md:min-h-[200px] !bg-[#222]" />
      <div className="px-5 py-5 md:px-6 space-y-4">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36 !bg-[#2a2a4e]" />
            <Skeleton className="h-4 w-24 !bg-[#2a2a4e]" />
          </div>
          <Skeleton className="h-8 w-28 !bg-[#2a2a4e]" />
        </div>
        <Skeleton className="h-4 w-48 !bg-[#2a2a4e]" />
        <div className="flex justify-end gap-3 pt-3 border-t border-[#2a2a4e]">
          <Skeleton className="h-10 w-24 !bg-[#2a2a4e]" />
          <Skeleton className="h-10 w-32 !bg-[#2a2a4e]" />
        </div>
      </div>
    </div>
  );
}

export function BookingApp() {
  const [lang, setLang] = useState<Lang>("ja");
  const [page, setPage] = useState("home");
  const [user, setUser] = useState<User | null>(null);
  const [searchForm, setSearchForm] = useState<SearchForm | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedQty, setSelectedQty] = useState(1);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) api("/api/auth/me").then(setUser).catch(() => localStorage.removeItem("token"));
  }, []);

  const handleLogout = () => { localStorage.removeItem("token"); setUser(null); setPage("home"); };

  const handleSearch = async (form: SearchForm) => {
    setSearchForm(form);
    setLoading(true);
    try {
      const dt = `${form.date}T${form.time}:00`;
      const data = await api("/api/reservations/search", { method: "POST", body: JSON.stringify({ pickupDatetime: dt, passengerCount: form.adults, luggageCount: form.luggage }) });
      setVehicles(data);
      setPage("vehicles");
    } catch { setVehicles([]); setPage("vehicles"); }
    setLoading(false);
  };

  const handleSelect = (v: Vehicle, qty: number) => {
    if (!user) { setPage("login"); return; }
    setSelectedVehicle(v);
    setSelectedQty(qty);
    setPage("confirm");
  };

  const handleConfirm = async () => {
    if (!selectedVehicle || !searchForm) return;
    setLoading(true);
    try {
      const data = await api("/api/reservations", { method: "POST", body: JSON.stringify({
        vehicleId: selectedVehicle.id, pickupLocation: searchForm.pickup, dropoffLocation: searchForm.dropoff,
        pickupDatetime: `${searchForm.date}T${searchForm.time}:00`, passengerCount: searchForm.adults,
        luggageCount: searchForm.luggage, language: lang,
        notes: selectedQty > 1 ? `${selectedQty} vehicles requested` : undefined,
      })});
      setReservation(data);
      setPage("completed");
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <Header lang={lang} setLang={setLang} user={user} t={t} setPage={setPage} handleLogout={handleLogout} />

      <main>
        {page === "home" && <HomeForm t={t} onSearch={handleSearch} />}
        {page === "vehicles" && <VehicleListView t={t} vehicles={vehicles} searchForm={searchForm} onSelect={handleSelect} loading={loading} />}
        {page === "confirm" && selectedVehicle && searchForm && <ConfirmView t={t} form={searchForm} vehicle={selectedVehicle} qty={selectedQty} onConfirm={handleConfirm} onBack={() => setPage("vehicles")} loading={loading} />}
        {page === "completed" && reservation && <CompletedView t={t} reservation={reservation} onNew={() => setPage("home")} />}
        {page === "login" && <LoginView t={t} onLogin={(u) => { setUser(u); setPage("home"); }} />}
        {page === "mypage" && user && <AccountPage t={t} lang={lang} user={user} onNewReservation={() => setPage("home")} />}
      </main>

      <footer className="bg-navy text-gray-500 text-center py-6 mt-16 text-xs">
        &copy; 2026 Premium Hire Service. All rights reserved.
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════ */
/* ── Header ──                           */
/* ═══════════════════════════════════════ */
function Header({ lang, setLang, user, t, setPage, handleLogout }: {
  lang: Lang; setLang: (l: Lang) => void; user: User | null; t: any; setPage: (p: string) => void; handleLogout: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-navy-gradient text-white px-4 md:px-8 h-16 flex items-center justify-between shadow-header sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setPage("home"); setMobileOpen(false); }} role="button" tabIndex={0} aria-label="Home">
        <div className="w-9 h-9 bg-gold-gradient rounded-lg flex items-center justify-center text-lg font-extrabold text-navy">H</div>
        <div className="hidden sm:block">
          <div className="text-base font-bold tracking-widest font-serif">{t.brand}</div>
          <div className="text-[10px] text-gold tracking-wider">{t.tagline}</div>
        </div>
      </div>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-3">
        {/* Language Switcher */}
        <div className="flex gap-0.5 mr-2" role="radiogroup" aria-label="Language">
          {(["ja","en","zh","ko"] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              role="radio" aria-checked={lang === l}
              className={cn(
                "px-2.5 py-1.5 text-xs border-none cursor-pointer rounded transition-colors duration-200",
                lang === l ? "bg-gold text-white font-bold" : "bg-transparent text-gray-400 hover:text-gray-200"
              )}>
              {l==="ja"?"日本語":l==="en"?"EN":l==="zh"?"中文":"한국어"}
            </button>
          ))}
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <button onClick={() => setPage("mypage")} className="bg-transparent border-none cursor-pointer text-sm text-gold-light font-medium hover:underline transition-colors duration-200 flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5" />
              {t.myReservations}
            </button>
            <button onClick={handleLogout} className="bg-transparent border-none cursor-pointer text-sm text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center gap-1" aria-label={t.logout}>
              <LogOut className="w-3.5 h-3.5" />
              {t.logout}
            </button>
          </div>
        ) : (
          <button onClick={() => setPage("login")} className="bg-transparent border-none cursor-pointer text-sm text-gold-light font-medium hover:underline transition-colors duration-200 flex items-center gap-1">
            <UserIcon className="w-3.5 h-3.5" />
            {t.login}
          </button>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden bg-transparent border-none cursor-pointer text-white p-2" aria-label="Menu" aria-expanded={mobileOpen}>
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="absolute top-16 left-0 right-0 bg-navy-dark border-t border-[#2a2a4e] p-4 space-y-3 md:hidden animate-fade-in z-50 shadow-xl">
          <div className="flex gap-1 justify-center pb-3 border-b border-[#2a2a4e]" role="radiogroup" aria-label="Language">
            {(["ja","en","zh","ko"] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                role="radio" aria-checked={lang === l}
                className={cn(
                  "px-3 py-2 text-xs border-none cursor-pointer rounded transition-colors duration-200",
                  lang === l ? "bg-gold text-white font-bold" : "bg-transparent text-gray-400"
                )}>
                {l==="ja"?"日本語":l==="en"?"EN":l==="zh"?"中文":"한국어"}
              </button>
            ))}
          </div>
          {user ? (
            <div className="space-y-2">
              <button onClick={() => { setPage("mypage"); setMobileOpen(false); }} className="w-full text-left bg-transparent border-none cursor-pointer text-sm text-gold-light font-medium px-2 py-2 rounded hover:bg-white/5 transition-colors duration-200 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> {t.myReservations}
              </button>
              <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="w-full text-left bg-transparent border-none cursor-pointer text-sm text-gray-400 px-2 py-2 rounded hover:bg-white/5 transition-colors duration-200 flex items-center gap-2">
                <LogOut className="w-4 h-4" /> {t.logout}
              </button>
            </div>
          ) : (
            <button onClick={() => { setPage("login"); setMobileOpen(false); }} className="w-full text-left bg-transparent border-none cursor-pointer text-sm text-gold-light font-medium px-2 py-2 rounded hover:bg-white/5 transition-colors duration-200 flex items-center gap-2">
              <UserIcon className="w-4 h-4" /> {t.login}
            </button>
          )}
        </div>
      )}
    </header>
  );
}

/* ═══════════════════════════════════════ */
/* ── Sub-Components ──                    */
/* ═══════════════════════════════════════ */

/* ── Location Autocomplete Input ── */
function LocationInput({ value, onChange, placeholder, icon }: { value: string; onChange: (v: string) => void; placeholder: string; icon?: React.ReactNode }) {
  const [suggestions, setSuggestions] = useState<LocationItem[]>([]);
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const search = useCallback((q: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (q.length < 1) { setSuggestions([]); return; }
      try { const data = await api(`/api/locations?q=${encodeURIComponent(q)}`); setSuggestions(data); setShow(true); } catch { setSuggestions([]); }
    }, 300);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setShow(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gold pointer-events-none">{icon}</div>}
        <Input value={value}
          onChange={e => { onChange(e.target.value); search(e.target.value); }}
          onFocus={() => { if (suggestions.length > 0) setShow(true); }}
          placeholder={placeholder}
          className={cn(icon && "pl-10")}
          aria-autocomplete="list"
          aria-expanded={show && suggestions.length > 0}
        />
      </div>
      {show && suggestions.length > 0 && (
        <ul role="listbox" className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-50 max-h-[200px] overflow-auto">
          {suggestions.map(s => (
            <li key={s.id} role="option" onClick={() => { onChange(s.name); setShow(false); }}
              className="px-3.5 py-2.5 cursor-pointer border-b border-gray-100 text-sm hover:bg-gold-50 transition-colors duration-150">
              <div className="font-semibold flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gold" />
                {s.name}
              </div>
              {s.address && <div className="text-[11px] text-gray-400 mt-0.5 ml-5">{s.address}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HomeForm({ t, onSearch }: { t: any; onSearch: (f: SearchForm) => void }) {
  const [f, set] = useState<SearchForm>({ pickup: "", dropoff: "", date: "", time: "", adults: 1, luggage: 0 });
  const [err, setErr] = useState("");
  const tmr = new Date(); tmr.setDate(tmr.getDate()+1);
  const md = tmr.toISOString().split("T")[0];

  return (
    <section className="relative min-h-[560px] md:min-h-[600px] flex flex-col items-center justify-center px-4 md:px-5 py-14 md:py-20" aria-label="Booking search">
      {/* Hero Background Image */}
      <div className="absolute inset-0 z-0">
        <img src="/hero-bg.jpg" alt="" className="w-full h-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(184,150,62,0.1)_0%,transparent_70%)]" />
      </div>

      {/* Hero Headline */}
      <div className="relative z-10 text-center mb-8 md:mb-10 animate-fade-in">
        <h1 className="text-3xl md:text-[42px] font-bold text-white tracking-wide font-serif leading-tight mb-3 md:mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          {t.heroTitle}
        </h1>
        <p className="text-gold-light text-sm md:text-base tracking-widest font-light drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
          {t.heroSubtitle}
        </p>
      </div>

      {/* Booking Form Card */}
      <div className="bg-white/[0.97] backdrop-blur-sm rounded-2xl w-full max-w-[960px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden animate-fade-in-up z-10">
        <div className="h-[3px] bg-[linear-gradient(90deg,#b8963e,#d4af5e,#b8963e)]" />
        <div className="px-5 md:px-8 pt-6 md:pt-7 pb-7 md:pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 md:gap-y-5">
            <div>
              <Label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gold" /> {t.pickup}
              </Label>
              <LocationInput value={f.pickup} onChange={v=>set({...f,pickup:v})} placeholder={t.pickupPh} icon={<MapPin className="w-4 h-4" />} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gold" /> {t.date}
                </Label>
                <Input type="date" value={f.date} min={md} onChange={e=>set({...f,date:e.target.value})} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gold" /> {t.time}
                </Label>
                <Input type="time" value={f.time} onChange={e=>set({...f,time:e.target.value})} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gold-light" /> {t.dropoff}
              </Label>
              <LocationInput value={f.dropoff} onChange={v=>set({...f,dropoff:v})} placeholder={t.dropoffPh} icon={<MapPin className="w-4 h-4" />} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gold" /> {t.adults}
                </Label>
                <select value={f.adults} onChange={e=>set({...f,adults:+e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer transition-colors duration-200"
                  aria-label={t.adults}>
                  {[1,2,3,4,5,6,7,8].map(n=><option key={n} value={n}>{n} {t.people}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-gold" /> {t.luggage}
                </Label>
                <select value={f.luggage} onChange={e=>set({...f,luggage:+e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer transition-colors duration-200"
                  aria-label={t.luggage}>
                  {[0,1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} {t.pieces}</option>)}
                </select>
              </div>
            </div>
          </div>
          {err && <div className="text-destructive text-sm mt-3 flex items-center gap-1.5" role="alert"><X className="w-4 h-4" /> {err}</div>}
          <div className="flex justify-end mt-5 md:mt-6">
            <Button variant="gold" size="lg" className="px-8 md:px-12 text-[15px] tracking-widest gap-2"
              onClick={() => { if(!f.pickup||!f.dropoff||!f.date||!f.time){setErr(t.required);return;} setErr(""); onSearch(f); }}>
              <Search className="w-4 h-4" /> {t.search}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Vehicle List View ── */
function VehicleListView({ t, vehicles, searchForm, onSelect, loading }: { t: any; vehicles: Vehicle[]; searchForm: SearchForm | null; onSelect: (v: Vehicle, qty: number) => void; loading: boolean }) {
  const gc: Record<string,string> = { standard: "bg-blue-500/20 text-blue-400", premium: "bg-gold/20 text-gold", vip: "bg-purple-500/20 text-purple-400" };
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getQty = (id: string) => quantities[id] || 1;
  const setQty = (id: string, n: number) => { if (n >= 1 && n <= 10) setQuantities(prev => ({ ...prev, [id]: n })); };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-5 pb-10">
      {/* Route Summary Bar */}
      <div className="bg-navy-gradient rounded-b-2xl px-4 md:px-8 py-4 md:py-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-8" aria-label="Route summary">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-gold" aria-hidden="true" />
          <span className="text-gold text-sm font-semibold">{searchForm?.pickup || "-"}</span>
        </div>
        <div className="hidden sm:block flex-1 max-w-[200px] h-0.5 bg-gold-gradient relative">
          <ChevronRight className="absolute -right-2 -top-2 w-4 h-4 text-gold-light" aria-hidden="true" />
        </div>
        <ChevronRight className="sm:hidden w-5 h-5 text-gold-light rotate-90" aria-hidden="true" />
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-gold-light" aria-hidden="true" />
          <span className="text-gold-light text-sm font-semibold">{searchForm?.dropoff || "-"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-7">
        {/* Trip Details Sidebar */}
        <div className="hidden lg:block sticky top-20 self-start">
          <Card className="overflow-hidden">
            <CardHeader className="px-5 py-4 border-b flex flex-row items-center gap-2.5">
              <Car className="w-5 h-5 text-gold" aria-hidden="true" />
              <CardTitle className="text-[15px] font-serif">{t.tripDetails}</CardTitle>
            </CardHeader>
            {searchForm && (
              <CardContent className="p-0">
                {[
                  { icon: <MapPin className="w-4 h-4" />, label: searchForm.pickup, color: "text-gold" },
                  { icon: <MapPin className="w-4 h-4" />, label: searchForm.dropoff, color: "text-gold-light" },
                  { icon: <Calendar className="w-4 h-4" />, label: searchForm.date, color: "text-gray-600" },
                  { icon: <Clock className="w-4 h-4" />, label: searchForm.time, color: "text-gray-600" },
                  { icon: <Users className="w-4 h-4" />, label: `${searchForm.adults} ${t.adults}`, color: "text-gray-600" },
                  { icon: <Briefcase className="w-4 h-4" />, label: `${searchForm.luggage} ${t.luggage}`, color: "text-gray-600" },
                ].map((row, i) => (
                  <div key={i} className="px-5 py-3 border-b border-gray-50 flex items-center gap-3">
                    <span className={cn("w-5 flex justify-center", row.color)}>{row.icon}</span>
                    <span className={cn("text-sm font-semibold", row.color)}>{row.label}</span>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        </div>

        {/* Vehicle Cards */}
        <div>
          <h2 className="text-xl md:text-[22px] font-bold mb-5 text-navy font-serif">{t.selectVehicle}</h2>

          {loading ? (
            <div className="grid gap-5 stagger-children">
              <VehicleCardSkeleton />
              <VehicleCardSkeleton />
              <VehicleCardSkeleton />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-16 text-gray-400 animate-fade-in">
              <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>{t.noResults}</p>
            </div>
          ) : (
            <div className="grid gap-5 stagger-children">
              {vehicles.map(v => (
                <div key={v.id} className="bg-navy rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr] border border-[#2a2a4e] hover:border-gold/30 transition-all duration-300 hover:shadow-[0_4px_24px_rgba(184,150,62,0.15)]">
                  {/* Vehicle Image */}
                  <div className="bg-[#111] flex items-center justify-center min-h-[180px] md:min-h-[200px] relative overflow-hidden">
                    {v.imageUrl ? (
                      <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="text-center">
                        <div className="flex justify-center text-gray-500">
                          {GradeIcon[v.grade.slug] ? (
                            <div className="w-16 h-16 rounded-full bg-[#1a1a2e] flex items-center justify-center">
                              <Car className="w-8 h-8 text-gold/60" />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-[#1a1a2e] flex items-center justify-center">
                              <Car className="w-8 h-8 text-gold/60" />
                            </div>
                          )}
                        </div>
                        <div className="text-gray-600 text-xs mt-2">{v.name}</div>
                      </div>
                    )}
                  </div>

                  {/* Vehicle Details */}
                  <div className="px-5 py-4 md:px-6 md:py-5 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <span className="text-lg font-bold text-white">{v.name}</span>
                          <span className={cn("text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1", gc[v.grade.slug] || "bg-gray-500/20 text-gray-400")}>
                            {GradeIcon[v.grade.slug]}
                            {t[v.grade.slug]||v.grade.name}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400 flex gap-4">
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {t.maxLabel} {v.maxPassengers}</span>
                          <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {t.maxLabel} {v.maxLuggage}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-extrabold text-gold">¥{v.basePrice.toLocaleString()}</div>
                        <div className="text-[11px] text-gray-500">{t.taxIncl} {t.perTrip}</div>
                      </div>
                    </div>

                    {/* Amenities */}
                    {v.amenities && v.amenities.length > 0 && (
                      <div className="flex gap-2.5 flex-wrap">
                        {v.amenities.map(a => (
                          <span key={a} className="text-xs text-gray-400 flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded">
                            {AmenityIcon[a] || <Sparkles className="w-3.5 h-3.5" />} {a}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quantity + Continue */}
                    <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 sm:gap-4 mt-auto pt-3 border-t border-[#2a2a4e]">
                      <div className="flex items-center justify-center">
                        <button onClick={() => setQty(v.id, getQty(v.id)-1)} className="w-10 h-10 bg-transparent border border-gray-600 text-gray-400 rounded-l-md cursor-pointer text-base flex items-center justify-center hover:bg-white/5 transition-colors duration-150" aria-label="Decrease quantity">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 h-10 flex items-center justify-center border-y border-gray-600 text-white text-[15px] font-bold" aria-label={`Quantity: ${getQty(v.id)}`}>{getQty(v.id)}</span>
                        <button onClick={() => setQty(v.id, getQty(v.id)+1)} className="w-10 h-10 bg-transparent border border-gray-600 text-gray-400 rounded-r-md cursor-pointer text-base flex items-center justify-center hover:bg-white/5 transition-colors duration-150" aria-label="Increase quantity">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <Button variant="gold" className="px-8 text-sm tracking-wider gap-2" onClick={() => onSelect(v, getQty(v.id))}>
                        {t.continueBtn} <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmView({ t, form, vehicle, qty, onConfirm, onBack, loading }: any) {
  const total = vehicle.basePrice * qty;
  const rows = [
    { icon: <Car className="w-4 h-4" />, label: t.vehicle, val: `${vehicle.name} (${t[vehicle.grade.slug]||vehicle.grade.name})` },
    { icon: <MapPin className="w-4 h-4" />, label: t.route, val: `${form.pickup} → ${form.dropoff}` },
    { icon: <Calendar className="w-4 h-4" />, label: t.dateTime, val: `${form.date} ${form.time}` },
    { icon: <Users className="w-4 h-4" />, label: t.pax, val: `${form.adults} ${t.people}` },
    { icon: <Briefcase className="w-4 h-4" />, label: t.luggage, val: `${form.luggage} ${t.pieces}` },
    ...(qty > 1 ? [{ icon: <Car className="w-4 h-4" />, label: t.vehicleCount, val: `${qty}` }] : []),
  ];
  return (
    <div className="max-w-[640px] mx-auto px-4 md:px-5 py-8 md:py-10 animate-fade-in-up">
      <h2 className="text-xl md:text-[22px] font-bold mb-6 text-navy font-serif">{t.confirmTitle}</h2>
      <Card className="shadow-card">
        <CardContent className="p-5 md:p-7">
          {rows.map((row, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100 gap-3">
              <span className="text-gray-500 text-sm flex items-center gap-2">
                <span className="text-gold">{row.icon}</span>
                {row.label}
              </span>
              <span className="font-semibold text-sm text-right">{row.val}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-4 mt-2">
            <span className="text-base font-bold">{qty > 1 ? t.total : t.price}</span>
            <span className="text-2xl font-extrabold text-gold">¥{total.toLocaleString()} <span className="text-xs font-normal text-gray-400">{t.taxIncl}</span></span>
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-3 mt-6 justify-end">
        <Button variant="outline" className="px-5 md:px-7 gap-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> {t.back}
        </Button>
        <Button variant="gold" className="px-7 md:px-9 text-sm gap-2" onClick={onConfirm} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {loading ? "..." : t.confirm}
        </Button>
      </div>
    </div>
  );
}

function CompletedView({ t, reservation, onNew }: { t: any; reservation: Reservation; onNew: () => void }) {
  const openReceipt = () => window.open(`/api/reservations/${reservation.id}/receipt`, "_blank");
  return (
    <div className="max-w-[480px] mx-auto px-4 md:px-5 py-16 md:py-20 text-center animate-fade-in-up">
      <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-green-50 flex items-center justify-center animate-pulse-gold">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>
      <h2 className="text-xl md:text-[22px] font-bold mb-2 font-serif">{t.completedTitle}</h2>
      <p className="text-gray-500 mb-6">{t.completedMsg}</p>
      <div className="px-4 py-4 bg-gold-50 rounded-lg mb-6 border border-gold-100">
        <div className="text-xs text-gray-400 mb-1">{t.orderNumber}</div>
        <div className="text-xl font-extrabold text-gold tracking-wider">{reservation.orderNumber}</div>
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="gold-outline" className="text-sm gap-2" onClick={openReceipt}>
          <FileText className="w-4 h-4" /> {t.receipt}
        </Button>
        <Button variant="gold" className="text-sm gap-2" onClick={onNew}>
          <Plus className="w-4 h-4" /> {t.newReservation}
        </Button>
      </div>
    </div>
  );
}

function LoginView({ t, onLogin }: { t: any; onLogin: (u: User) => void }) {
  const [isReg, setIsReg] = useState(false);
  const [f, set] = useState({ email: "", password: "", name: "", phone: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      if (isReg) {
        const data = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ email: f.email, password: f.password, name: f.name, phone: f.phone }) });
        localStorage.setItem("token", data.token);
        onLogin(data.user);
      } else {
        const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: f.email, password: f.password }) });
        localStorage.setItem("token", data.token);
        onLogin(data.user);
      }
    } catch (e: any) { setErr(e.message || t.loginError); }
    setLoading(false);
  };

  return (
    <div className="max-w-[400px] mx-auto px-4 md:px-5 py-12 md:py-16 animate-fade-in-up">
      <h2 className="text-xl md:text-[22px] font-bold mb-7 text-center font-serif">{isReg ? t.register : t.login}</h2>
      <Card className="shadow-card">
        <CardContent className="p-5 md:p-7 space-y-4">
          {isReg && (
            <div>
              <Label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-gold" /> {t.name}
              </Label>
              <Input value={f.name} onChange={e=>set({...f,name:e.target.value})} aria-label={t.name} />
            </div>
          )}
          <div>
            <Label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gold" /> {t.email}
            </Label>
            <Input type="email" value={f.email} onChange={e=>set({...f,email:e.target.value})} placeholder="admin@example.com" aria-label={t.email} />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-gold" /> {t.password}
            </Label>
            <Input type="password" value={f.password} onChange={e=>set({...f,password:e.target.value})} placeholder="password123" aria-label={t.password} />
          </div>
          {isReg && (
            <div>
              <Label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gold" /> {t.phone}
              </Label>
              <Input value={f.phone} onChange={e=>set({...f,phone:e.target.value})} aria-label={t.phone} />
            </div>
          )}
          {err && <div className="text-destructive text-sm flex items-center gap-1.5" role="alert"><X className="w-4 h-4" /> {err}</div>}
          <Button variant="gold" className="w-full py-3 text-[15px] mt-2 gap-2" onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isReg ? <UserIcon className="w-4 h-4" /> : <LogOut className="w-4 h-4 rotate-180" />)}
            {isReg ? t.register : t.login}
          </Button>
          <div className="text-center">
            <button onClick={() => setIsReg(!isReg)} className="bg-transparent border-none cursor-pointer text-sm text-gold font-medium hover:underline transition-colors duration-200">{isReg ? t.login : t.register}</button>
          </div>
          <div className="p-3 bg-gray-100 rounded-md text-[11px] text-gray-400 flex items-start gap-2">
            <Eye className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Demo accounts (pw: password123):<br/>admin@example.com / user@example.com / corp@example.com</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Account Page ── */
type MenuItem = { key: string; icon: React.ReactNode; label: string };

function AccountPage({ t, lang, user, onNewReservation }: { t: any; lang: string; user: User; onNewReservation: () => void }) {
  const [section, setSection] = useState("overview");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    api("/api/reservations").then(setReservations).catch(() => {});
    api("/api/reservations/invoices").then(setInvoices).catch(() => {});
  }, []);

  const activeRes = reservations.filter(r => ["PENDING", "CONFIRMED", "DISPATCHED"].includes(r.status));
  const pastRes = reservations.filter(r => ["COMPLETED", "CANCELLED"].includes(r.status));

  const handlePasswordChange = async () => {
    setPwMsg(""); setPwErr("");
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwErr(t.passwordMismatch); return; }
    try {
      await api("/api/auth/password", { method: "PUT", body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }) });
      setPwMsg(t.passwordChanged);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e: any) { setPwErr(e.message); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm(t.cancelConfirm)) return;
    try {
      await api(`/api/reservations/${id}/cancel`, { method: "PATCH" });
      const data = await api("/api/reservations");
      setReservations(data);
    } catch (e: any) { alert(e.message); }
  };

  const profileMenu: MenuItem[] = [
    { key: "overview", icon: <UserIcon className="w-4 h-4" />, label: t.overview },
    { key: "password", icon: <Lock className="w-4 h-4" />, label: t.changePassword },
  ];
  const bookingMenu: MenuItem[] = [
    { key: "active", icon: <ClipboardList className="w-4 h-4" />, label: t.activeReservations },
    { key: "past", icon: <History className="w-4 h-4" />, label: t.pastReservations },
    { key: "invoices", icon: <FileText className="w-4 h-4" />, label: t.invoiceList },
  ];

  const sectionLabels: Record<string, string> = {
    overview: t.overview, password: t.changePassword,
    active: t.activeReservations, past: t.pastReservations, invoices: t.invoiceList,
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 md:px-5 py-6 md:py-8 animate-fade-in">
      {/* Mobile Section Selector */}
      <div className="lg:hidden mb-4">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex items-center justify-between bg-navy text-white px-4 py-3 rounded-xl text-sm font-medium cursor-pointer border-none">
          <span className="flex items-center gap-2">
            {profileMenu.concat(bookingMenu).find(m => m.key === section)?.icon}
            {sectionLabels[section]}
          </span>
          <ChevronRight className={cn("w-4 h-4 transition-transform duration-200", mobileMenuOpen && "rotate-90")} />
        </button>
        {mobileMenuOpen && (
          <div className="bg-navy-dark rounded-b-xl mt-0.5 py-2 animate-fade-in shadow-lg">
            {profileMenu.concat(bookingMenu).map(m => (
              <button key={m.key} onClick={() => { setSection(m.key); setMobileMenuOpen(false); }}
                className={cn("w-full text-left px-5 py-2.5 border-none cursor-pointer text-sm flex items-center gap-2.5 transition-colors duration-150",
                  section === m.key ? "text-gold-light bg-gold/10" : "text-gray-400 bg-transparent hover:bg-white/5")}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-7 min-h-[70vh]">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block w-[260px] shrink-0 bg-navy-gradient rounded-xl px-4 py-6 text-white self-start">
          <div className="text-[15px] font-bold mb-1 text-gold-light flex items-center gap-2">
            <UserIcon className="w-4 h-4" /> {user.name}
          </div>
          <div className="text-[11px] text-gray-500 mb-6 ml-6">{user.email}</div>

          <nav aria-label="Account navigation">
            <div className="text-xs font-semibold text-gold-light mb-2 px-1 border-b border-gold/30 pb-2">{t.myProfile}</div>
            {profileMenu.map(m => (
              <button key={m.key} onClick={() => setSection(m.key)}
                className={cn(
                  "w-full text-left px-4 py-2.5 border-none cursor-pointer text-sm rounded-md flex items-center gap-2.5 transition-colors duration-200",
                  section === m.key ? "text-gold-light bg-gold/10" : "text-gray-400 bg-transparent hover:bg-white/5"
                )}>
                {m.icon} {m.label}
              </button>
            ))}

            <div className="text-xs font-semibold text-gold-light mt-5 mb-2 px-1 border-b border-gold/30 pb-2">{t.myBookings}</div>
            {bookingMenu.map(m => (
              <button key={m.key} onClick={() => setSection(m.key)}
                className={cn(
                  "w-full text-left px-4 py-2.5 border-none cursor-pointer text-sm rounded-md flex items-center gap-2.5 transition-colors duration-200",
                  section === m.key ? "text-gold-light bg-gold/10" : "text-gray-400 bg-transparent hover:bg-white/5"
                )}>
                {m.icon} {m.label}
              </button>
            ))}
          </nav>

          <Button variant="gold" className="w-full mt-6 text-sm gap-2" onClick={onNewReservation}>
            <Plus className="w-4 h-4" /> {t.makeNewReservation}
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {section === "overview" && (
            <Card className="shadow-card animate-fade-in-up">
              <CardContent className="p-5 md:p-7">
                <h2 className="text-xl font-bold mb-6 font-serif text-gray-800 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-gold" /> {t.overview}
                </h2>
                <div className="grid gap-4">
                  {[
                    { icon: <UserIcon className="w-4 h-4" />, label: t.name, value: user.name },
                    { icon: <Mail className="w-4 h-4" />, label: t.email, value: user.email },
                  ].map(row => (
                    <div key={row.label} className="flex border-b border-gray-100 pb-3 items-center">
                      <span className="w-[160px] text-sm font-semibold text-gray-500 flex items-center gap-2">
                        <span className="text-gold">{row.icon}</span> {row.label}
                      </span>
                      <span className="text-sm text-gray-800">{row.value}</span>
                    </div>
                  ))}
                  <div className="flex border-b border-gray-100 pb-3 items-center">
                    <span className="w-[160px] text-sm font-semibold text-gray-500 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-gold" /> {t.activeReservations}
                    </span>
                    <span className="text-sm text-gray-800 font-bold">{activeRes.length}</span>
                  </div>
                  <div className="flex border-b border-gray-100 pb-3 items-center">
                    <span className="w-[160px] text-sm font-semibold text-gray-500 flex items-center gap-2">
                      <History className="w-4 h-4 text-gold" /> {t.pastReservations}
                    </span>
                    <span className="text-sm text-gray-800 font-bold">{pastRes.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {section === "password" && (
            <Card className="max-w-[400px] shadow-card animate-fade-in-up">
              <CardContent className="p-5 md:p-7 space-y-4">
                <h2 className="text-xl font-bold mb-4 font-serif text-gray-800 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-gold" /> {t.changePassword}
                </h2>
                <div>
                  <Label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-gold" /> {t.currentPassword}
                  </Label>
                  <Input type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} aria-label={t.currentPassword} />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-gold" /> {t.newPassword}
                  </Label>
                  <Input type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} aria-label={t.newPassword} />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-gold" /> {t.confirmNewPassword}
                  </Label>
                  <Input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} aria-label={t.confirmNewPassword} />
                </div>
                {pwErr && <div className="text-destructive text-sm flex items-center gap-1.5" role="alert"><X className="w-4 h-4" /> {pwErr}</div>}
                {pwMsg && <div className="text-green-600 text-sm flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> {pwMsg}</div>}
                <Button variant="gold" onClick={handlePasswordChange} className="gap-2"><Shield className="w-4 h-4" /> {t.save}</Button>
              </CardContent>
            </Card>
          )}

          {section === "active" && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl font-bold mb-5 font-serif text-gray-800 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-gold" /> {t.activeReservations}
              </h2>
              {activeRes.length === 0 ? (
                <Card className="text-center py-10 text-gray-400 shadow-card">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  {t.noActiveReservations}
                </Card>
              ) : (
                <div className="stagger-children">
                  {activeRes.map(r => <ReservationCard key={r.id} r={r} t={t} lang={lang} onCancel={() => handleCancel(r.id)} showCancel />)}
                </div>
              )}
            </div>
          )}

          {section === "past" && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl font-bold mb-5 font-serif text-gray-800 flex items-center gap-2">
                <History className="w-5 h-5 text-gold" /> {t.pastReservations}
              </h2>
              {pastRes.length === 0 ? (
                <Card className="text-center py-10 text-gray-400 shadow-card">
                  <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  {t.noPastReservations}
                </Card>
              ) : (
                <div className="stagger-children">
                  {pastRes.map(r => <ReservationCard key={r.id} r={r} t={t} lang={lang} />)}
                </div>
              )}
            </div>
          )}

          {section === "invoices" && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl font-bold mb-5 font-serif text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold" /> {t.invoiceList}
              </h2>
              {invoices.length === 0 ? (
                <Card className="text-center py-10 text-gray-400 shadow-card">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  {t.noInvoices}
                </Card>
              ) : (
                <Card className="overflow-auto shadow-card">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gold-50">
                        {["#", t.orderNumber, t.route, t.price, "Status"].map(h => (
                          <TableHead key={h} className="font-semibold text-gray-600 text-sm">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv: any) => (
                        <TableRow key={inv.id + inv.orderNumber} className="hover:bg-gold-50/50 transition-colors duration-150">
                          <TableCell className="font-semibold text-gold text-sm">{inv.invoiceNumber}</TableCell>
                          <TableCell className="text-sm">{inv.orderNumber}</TableCell>
                          <TableCell className="text-sm max-w-[200px] overflow-hidden text-ellipsis">{inv.route}</TableCell>
                          <TableCell className="font-semibold text-sm">¥{inv.total?.toLocaleString()}</TableCell>
                          <TableCell>
                            <StatusBadge status={inv.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          )}

          {/* Mobile: New Reservation Button */}
          <div className="lg:hidden mt-6">
            <Button variant="gold" className="w-full text-sm gap-2" onClick={onNewReservation}>
              <Plus className="w-4 h-4" /> {t.makeNewReservation}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReservationCard({ r, t, lang, onCancel, showCancel }: { r: Reservation; t: any; lang: string; onCancel?: () => void; showCancel?: boolean }) {
  return (
    <Card className="mb-3 shadow-card hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 md:p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-gold text-sm">{r.orderNumber}</span>
          <StatusBadge status={r.status} />
        </div>
        <div className="text-sm text-gray-600 mb-1.5 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
          <span className="truncate">{r.pickupLocation} → {r.dropoffLocation}</span>
        </div>
        <div className="flex flex-wrap gap-3 md:gap-5 text-xs text-gray-400 mb-2">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(r.pickupDatetime).toLocaleString(lang === "ja" ? "ja-JP" : "en-US")}</span>
          <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {r.vehicle?.name}</span>
          <span className="font-bold text-gray-800">¥{r.price.toLocaleString()}</span>
        </div>
        {showCancel && r.status !== "CANCELLED" && onCancel && (
          <button onClick={onCancel} className="bg-transparent border-none cursor-pointer text-xs text-destructive font-medium mt-1 hover:underline transition-colors duration-200 flex items-center gap-1">
            <X className="w-3 h-3" /> {t.cancelReservation}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
