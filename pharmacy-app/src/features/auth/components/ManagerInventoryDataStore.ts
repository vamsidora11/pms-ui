import { useState } from "react";

export interface Medicine {
  id: string;
  name: string;
  strength: string;
  category: string;
  manufacturer: string;
  unit: string;
  minThreshold: number;
  description?: string;
}

export interface MedicineLot {
  id: string;
  medicineId: string;
  lotNumber: string;
  quantity: number;
  expiryDate: string;
  source: "supplier" | "restock" | "transfer";
  status: "active" | "returned" | "disposed";
}

export interface RestockRequest {
  id: string;
  medicineId: string;
  medicineName: string;
  strength: string;
  requestedQty: number;
  requestedBy: string;
  requestDate: string;
  notes?: string;
  status: "Pending" | "Approved" | "Rejected";
  rejectionReason?: string;
  approvedBy?: string;
  approvedDate?: string;
}

const INITIAL_MEDICINES: Medicine[] = [
  { id: "MED-001", name: "Lisinopril", strength: "10mg", category: "Cardiovascular", manufacturer: "Pfizer", unit: "Tablets", minThreshold: 200, description: "ACE inhibitor used for hypertension." },
  { id: "MED-002", name: "Metformin", strength: "500mg", category: "Diabetes", manufacturer: "Sun Pharma", unit: "Tablets", minThreshold: 300 },
  { id: "MED-003", name: "Amoxicillin", strength: "250mg", category: "Antibiotic", manufacturer: "GSK", unit: "Capsules", minThreshold: 150 },
  { id: "MED-004", name: "Cetirizine", strength: "10mg", category: "Allergy", manufacturer: "Cipla", unit: "Tablets", minThreshold: 100 },
  { id: "MED-005", name: "Omeprazole", strength: "20mg", category: "Gastrointestinal", manufacturer: "Dr. Reddy's", unit: "Capsules", minThreshold: 120 },
];

const INITIAL_LOTS: MedicineLot[] = [
  { id: "LOT-001", medicineId: "MED-001", lotNumber: "LIS-2401-A", quantity: 320, expiryDate: "2026-11-10", source: "supplier", status: "active" },
  { id: "LOT-002", medicineId: "MED-001", lotNumber: "LIS-2403-B", quantity: 90, expiryDate: "2026-04-05", source: "restock", status: "active" },
  { id: "LOT-003", medicineId: "MED-002", lotNumber: "MET-2405-C", quantity: 480, expiryDate: "2026-09-18", source: "supplier", status: "active" },
  { id: "LOT-004", medicineId: "MED-003", lotNumber: "AMX-2312-D", quantity: 60, expiryDate: "2026-03-20", source: "supplier", status: "active" },
  { id: "LOT-005", medicineId: "MED-004", lotNumber: "CET-2310-E", quantity: 0, expiryDate: "2026-03-10", source: "transfer", status: "returned" },
  { id: "LOT-006", medicineId: "MED-005", lotNumber: "OMP-2402-F", quantity: 110, expiryDate: "2026-05-02", source: "supplier", status: "active" },
];

const INITIAL_REQUESTS: RestockRequest[] = [
  { id: "REQ-001", medicineId: "MED-003", medicineName: "Amoxicillin", strength: "250mg", requestedQty: 250, requestedBy: "Tech. Riya Sharma", requestDate: "2026-03-14", notes: "Current stock is close to threshold due to recent demand.", status: "Pending" },
  { id: "REQ-002", medicineId: "MED-005", medicineName: "Omeprazole", strength: "20mg", requestedQty: 180, requestedBy: "Tech. Aman Verma", requestDate: "2026-03-11", notes: "Additional stock needed for ward refill.", status: "Approved", approvedBy: "Manager", approvedDate: "2026-03-12" },
  { id: "REQ-003", medicineId: "MED-004", medicineName: "Cetirizine", strength: "10mg", requestedQty: 120, requestedBy: "Tech. Neha Rao", requestDate: "2026-03-09", notes: "Seasonal allergy demand increase.", status: "Rejected", rejectionReason: "Pending supplier price confirmation.", approvedBy: "Manager", approvedDate: "2026-03-10" },
];

function nextNumericId(prefix: string, length: number, currentSize: number) {
  return `${prefix}-${String(currentSize + 1).padStart(length, "0")}`;
}

export function useManagerInventoryData() {
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [medicineLots, setMedicineLots] = useState<MedicineLot[]>(INITIAL_LOTS);
  const [restockRequests, setRestockRequests] = useState<RestockRequest[]>(INITIAL_REQUESTS);

  const addMedicine = (medicine: Medicine) => {
    setMedicines((prev) => [...prev, medicine]);
  };

  const approveRestockRequest = (requestId: string, expiryDate: string) => {
    let approvedRequest: RestockRequest | undefined;

    setRestockRequests((prev) =>
      prev.map((request) => {
        if (request.id !== requestId) return request;
        approvedRequest = { ...request, status: "Approved", approvedBy: "Manager", approvedDate: new Date().toISOString(), rejectionReason: undefined };
        return approvedRequest;
      }),
    );

    if (!approvedRequest) return;
    const createdFromRequest = approvedRequest;

    setMedicineLots((prev) => [
      ...prev,
      {
        id: nextNumericId("LOT", 3, prev.length),
        medicineId: createdFromRequest.medicineId,
        lotNumber: `${createdFromRequest.medicineName.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
        quantity: createdFromRequest.requestedQty,
        expiryDate,
        source: "restock",
        status: "active",
      },
    ]);
  };

  const rejectRestockRequest = (requestId: string, rejectionReason: string) => {
    setRestockRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? { ...request, status: "Rejected", rejectionReason, approvedBy: "Manager", approvedDate: new Date().toISOString() }
          : request,
      ),
    );
  };

  const markLotReturned = (lotId: string) => {
    setMedicineLots((prev) => prev.map((lot) => (lot.id === lotId ? { ...lot, status: "returned" } : lot)));
  };

  const markLotDisposed = (lotId: string) => {
    setMedicineLots((prev) => prev.map((lot) => (lot.id === lotId ? { ...lot, status: "disposed" } : lot)));
  };

  return {
    medicines,
    medicineLots,
    restockRequests,
    addMedicine,
    approveRestockRequest,
    rejectRestockRequest,
    markLotReturned,
    markLotDisposed,
  };
}
