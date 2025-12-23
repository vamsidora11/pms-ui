import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../components/layouts/Applayout";
import LoginPage from "../pages/LoginPage";
import PharmacistDashboard from "../pages/PharmacistDashboard";
import ManualPrescriptionView from "../modules/prescription/ManualPrescriptionView";
import PrescriptionValidationPage from "../modules/prescription/PrescriptionValidationPage";
import TechnicianDashboard from "../pages/TechnicianDashboard";

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
