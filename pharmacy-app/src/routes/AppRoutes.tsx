import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../components/layouts/Applayout/Applayout";
import LoginPage from "../features/auth/LoginPage";
import PharmacistDashboard from "../features/auth/PharmacistDashboard";
import ManualPrescriptionView from "../features/prescription/ManualPrescriptionView";
import PrescriptionValidationPage from "../features/prescription/PrescriptionValidationPage";
import TechnicianDashboard from "../features/auth/TechnicianDashboard";
import LabelGeneration from "../features/prescription/LabelGeneration";
import Refill from "../features/prescription/Refill";
import PrescriptionHistory from "../features/prescription/PrescriptionHistory";
import PatientProfile from "../features/prescription/PatientProfile";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute allowedRoles={["Manager"]} />}>
        <Route path="/manager" element={<AppLayout />}>
          <Route path="dashboard" element={<div>Manager Dashboard</div>} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Pharmacist"]} />}>
        <Route path="/pharmacist" element={<AppLayout />}>
          <Route index element={<PharmacistDashboard />} /> {/* default */}
          <Route path="dashboard" element={<PharmacistDashboard />} />
          <Route path="entry" element={<ManualPrescriptionView />} />
          <Route path="validation" element={<PrescriptionValidationPage />} />
          <Route path="labels" element={<LabelGeneration/>} />
          <Route path="refills" element={<Refill/>} />
          <Route path="history" element={<PrescriptionHistory/>} />
          <Route path="profiles" element={<PatientProfile/>} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Technician"]} />}>
        <Route path="/technician" element={<AppLayout />}>
          <Route path="dashboard" element={<TechnicianDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
