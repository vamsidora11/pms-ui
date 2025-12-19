// src/api/prescriptions.ts
import { ENDPOINTS, API_BASE } from "./endpoints";
import { http } from "./http";

export async function getPrescriptions() {
  const res = await http(API_BASE + ENDPOINTS.prescriptions, { method: "GET" });
  if (!res.ok) throw new Error("Failed to load prescriptions");
  return res.json();
}

export async function getPrescriptionById(id: string) {
  const res = await http(API_BASE + ENDPOINTS.prescriptionById(id), { method: "GET" });
  if (!res.ok) throw new Error("Failed to load prescription");
  return res.json();
}

export async function createPrescription(payload: unknown) {
  const res = await http(API_BASE + ENDPOINTS.prescriptions, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create prescription");
  return res.json();
}

export async function updatePrescription(id: string, payload: unknown) {
  const res = await http(API_BASE + ENDPOINTS.prescriptionById(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update prescription");
  return res.json();
}
