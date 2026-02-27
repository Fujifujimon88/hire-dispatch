export type Vehicle = {
  id: string;
  name: string;
  vehicleType: string;
  plateNumber: string | null;
  maxPassengers: number;
  grade?: { id: string; name: string; slug: string };
};

export type Driver = {
  id: string;
  name: string;
  phone: string | null;
};

export type LocationItem = {
  id: string;
  name: string;
  address: string | null;
  category: string | null;
};

export type Dispatch = {
  id: string;
  orderNumber: string;
  personInCharge: string;
  arrangementMonth: string | null;
  arrangementDate: string;
  pickupLocation: string;
  pickupTime: string;
  stopover: string | null;
  dropoffLocation: string;
  returnTime: string | null;
  vehicleCount: number | null;
  customerName: string;
  customerCount: number | null;
  customerContact: string | null;
  vehicleId: string | null;
  vehicle?: Vehicle | null;
  driverId: string | null;
  driver?: Driver | null;
  notes: string | null;
  status: string;
  calendarEventId: string | null;
  // Sheets / PDF / Email 連携
  dispatchType: "BOJ" | "OTHER";
  sheetRowNumber: number | null;
  pdfFileId: string | null;
  pdfUrl: string | null;
  budgetPriceTaxIncluded: number | null;
  priceComment: string | null;
  driverInfo: string | null;
  internalNotifyEmails: string[];
  clientNotifyEmails: string[];
  createdAt: string;
  updatedAt: string;
};

export type Consultation = {
  id: string;
  customerName: string;
  contactInfo: string | null;
  preferredDatetime: string | null;
  consultationDetails: string | null;
  status: string;
  assignedTo: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DispatchForm = {
  orderNumber: string;
  personInCharge: string;
  arrangementDate: string;
  pickupLocation: string;
  pickupTime: string;
  stopover: string;
  dropoffLocation: string;
  returnTime: string;
  vehicleCount: number;
  customerName: string;
  customerCount: number;
  customerContact: string;
  vehicleId: string;
  notes: string;
  // Sheets / PDF / Email 連携
  dispatchType: "BOJ" | "OTHER" | "";
  budgetPriceTaxIncluded: string;
  priceComment: string;
  driverInfo: string;
  internalNotifyEmails: string;
  clientNotifyEmails: string;
};

export type ConsultationForm = {
  customerName: string;
  contactInfo: string;
  preferredDatetime: string;
  consultationDetails: string;
  status: string;
  assignedTo: string;
  notes: string;
};
