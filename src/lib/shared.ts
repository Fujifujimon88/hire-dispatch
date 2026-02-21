/* ── API helper ── */
export async function api(path: string, opts: any = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const h: any = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  const res = await fetch(path, { ...opts, headers: { ...h, ...opts.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Error");
  return data;
}

/* ── Types ── */
export type Vehicle = { id: string; name: string; vehicleType: string; maxPassengers: number; maxLuggage: number; basePrice: number; imageUrl: string | null; amenities: string[]; grade: { id: string; name: string; slug: string }; plateNumber?: string; isActive?: boolean };
export type Reservation = { id: string; orderNumber: string; pickupLocation: string; dropoffLocation: string; pickupDatetime: string; passengerCount: number; luggageCount: number; price: number; status: string; vehicle: Vehicle; user?: { name: string }; company?: { name: string }; driver?: { name: string } };
export type User = { id: string; email: string; name: string; role: string; userType: string; companyId?: string; companyName?: string };

/* ── Shared constants ── */
export const SC: Record<string, string> = { PENDING: "#f39c12", CONFIRMED: "#3498db", DISPATCHED: "#8e44ad", COMPLETED: "#27ae60", CANCELLED: "#c0392b" };

/* ── Amenity icon names (Lucide) ── */
export const AI: Record<string, string> = { TV: "Tv", "Wi-Fi": "Wifi", USB: "PlugZap", Bluetooth: "Bluetooth" };
