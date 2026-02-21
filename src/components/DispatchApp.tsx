"use client";
import { useState, useEffect, useCallback } from "react";
import { DispatchForm } from "./DispatchForm";
import { DispatchTable } from "./DispatchTable";
import { ConsultationForm } from "./ConsultationForm";
import { ConsultationTable } from "./ConsultationTable";
import type { Dispatch, Consultation, Vehicle } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ClipboardList, MessageSquare, ChevronRight,
} from "lucide-react";

export function DispatchApp() {
  const [tab, setTab] = useState<"confirmed" | "consultation">("confirmed");
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editDispatch, setEditDispatch] = useState<Dispatch | null>(null);
  const [editConsultation, setEditConsultation] = useState<Consultation | null>(null);

  const loadDispatches = useCallback(async () => {
    try {
      const res = await fetch("/api/dispatches");
      if (res.ok) setDispatches(await res.json());
    } catch { /* ignore */ }
  }, []);

  const loadConsultations = useCallback(async () => {
    try {
      const res = await fetch("/api/consultations");
      if (res.ok) setConsultations(await res.json());
    } catch { /* ignore */ }
  }, []);

  const loadVehicles = useCallback(async () => {
    try {
      const res = await fetch("/api/vehicles");
      if (res.ok) setVehicles(await res.json());
    } catch { /* ignore */ }
  }, []);

  // Load all data on mount
  useEffect(() => {
    loadVehicles();
    loadDispatches();
    loadConsultations();
  }, [loadVehicles, loadDispatches, loadConsultations]);

  // Reload current tab data on tab switch
  useEffect(() => {
    if (tab === "confirmed") loadDispatches();
    else loadConsultations();
  }, [tab, loadDispatches, loadConsultations]);

  async function handleDeleteDispatch(id: string) {
    await fetch(`/api/dispatches/${id}`, { method: "DELETE" });
    loadDispatches();
  }

  async function handleDeleteConsultation(id: string) {
    await fetch(`/api/consultations/${id}`, { method: "DELETE" });
    loadConsultations();
  }

  function handleConvertConsultation(c: Consultation) {
    setTab("confirmed");
    setEditDispatch({
      id: "",
      orderNumber: "",
      personInCharge: "",
      arrangementMonth: null,
      arrangementDate: c.preferredDatetime ? c.preferredDatetime.split("T")[0] : "",
      pickupLocation: "",
      pickupTime: c.preferredDatetime || "",
      stopover: null,
      dropoffLocation: "",
      returnTime: null,
      customerName: c.customerName,
      customerCount: null,
      customerContact: c.contactInfo,
      vehicleId: null,
      driverId: null,
      notes: c.consultationDetails,
      status: "CONFIRMED",
      calendarEventId: null,
      dispatchType: "OTHER",
      sheetRowNumber: null,
      pdfFileId: null,
      pdfUrl: null,
      budgetPriceTaxIncluded: null,
      priceComment: null,
      driverInfo: null,
      internalNotifyEmails: [],
      clientNotifyEmails: [],
      createdAt: "",
      updatedAt: "",
    });
  }

  function handleTabChange(key: "confirmed" | "consultation") {
    setTab(key);
    setEditDispatch(null);
    setEditConsultation(null);
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 px-4 md:px-8 flex items-center justify-between bg-navy-gradient text-white shadow-header">
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 bg-gold-gradient rounded-lg flex items-center justify-center text-lg font-extrabold text-navy">
            H
          </div>
          <div>
            <div className="text-sm font-bold tracking-widest font-serif">手配書管理</div>
            <div className="text-[10px] text-gray-400 tracking-wider">DISPATCH MANAGEMENT</div>
          </div>
        </a>
        <div className="flex items-center gap-3" />
      </header>

      {/* Breadcrumb */}
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 pt-5">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
          <a href="/" className="hover:text-gold transition-colors cursor-pointer">ホーム</a>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gold font-semibold">{tab === "confirmed" ? "確定案件" : "相談案件"}</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1100px] mx-auto px-4 md:px-6 pb-12">
        {/* Tab Navigation */}
        <div className="flex gap-0 mb-6 border-b-2 border-gray-200">
          <button
            type="button"
            onClick={() => handleTabChange("confirmed")}
            className={cn(
              "px-5 py-2.5 cursor-pointer text-sm font-semibold transition-colors -mb-[2px] flex items-center gap-2 border-b-2",
              tab === "confirmed"
                ? "text-gold border-gold bg-white"
                : "text-gray-400 hover:text-gray-600 border-transparent bg-transparent"
            )}
          >
            <ClipboardList className="w-4 h-4" />
            確定案件
            <span className={cn(
              "ml-1 text-xs px-1.5 py-0.5 rounded-full",
              tab === "confirmed" ? "bg-gold/10 text-gold" : "bg-gray-100 text-gray-400"
            )}>
              {dispatches.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("consultation")}
            className={cn(
              "px-5 py-2.5 cursor-pointer text-sm font-semibold transition-colors -mb-[2px] flex items-center gap-2 border-b-2",
              tab === "consultation"
                ? "text-gold border-gold bg-white"
                : "text-gray-400 hover:text-gray-600 border-transparent bg-transparent"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            相談案件
            <span className={cn(
              "ml-1 text-xs px-1.5 py-0.5 rounded-full",
              tab === "consultation" ? "bg-gold/10 text-gold" : "bg-gray-100 text-gray-400"
            )}>
              {consultations.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        {tab === "confirmed" && (
          <div key="confirmed" className="animate-fade-in">
            <DispatchForm
              vehicles={vehicles}
              editItem={editDispatch}
              onSaved={() => { loadDispatches(); setEditDispatch(null); }}
              onCancel={() => setEditDispatch(null)}
            />
            <DispatchTable
              dispatches={dispatches}
              onEdit={d => { setEditDispatch(d); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              onDelete={handleDeleteDispatch}
            />
          </div>
        )}
        {tab === "consultation" && (
          <div key="consultation" className="animate-fade-in">
            <ConsultationForm
              editItem={editConsultation}
              onSaved={() => { loadConsultations(); setEditConsultation(null); }}
              onCancel={() => setEditConsultation(null)}
            />
            <ConsultationTable
              consultations={consultations}
              onEdit={c => { setEditConsultation(c); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              onDelete={handleDeleteConsultation}
              onConvert={handleConvertConsultation}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-navy-gradient text-center py-6 text-xs text-gray-500 tracking-wider">
        Premium Hire - Dispatch Management System
      </footer>
    </div>
  );
}
