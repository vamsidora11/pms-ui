import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import PharmacistDashboard from "../pages/PharmacistDashboard";
import TechnicianDashboard from "../pages/TechnicianDashboard";
import ManualPrescriptionView from "../modules/pharmacist/ManualPrescriptionView";
import PrescriptionValidationPage from "../modules/pharmacist/PrescriptionValidationPage";
import AppLayout from "../components/layouts/Applayout";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Pharmacist */}
      <Route path="/pharmacist" element={<AppLayout role="Pharmacist" />}>
        <Route path="dashboard" element={<PharmacistDashboard />} />
        <Route path="entry" element={<ManualPrescriptionView />} />
        <Route path="validation" element={<PrescriptionValidationPage />} />
      </Route>

      {/* Technician */}
      <Route path="/technician" element={<AppLayout role="Technician" />}>
        <Route path="dashboard" element={<TechnicianDashboard />} />
      </Route>

      {/* Default */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
