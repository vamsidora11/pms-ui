import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "@components/layouts/Applayout/Applayout";
import { ROUTES } from "../constants/routes";
import { lazy, Suspense } from "react";

const LoginPage = lazy(() => import("@auth/LoginPage"));
const PharmacistDashboard = lazy(() => import("@auth/PharmacistDashboard"));
const ManualPrescriptionView = lazy(() => import("@prescription/ManualPrescriptionView"));
const PrescriptionValidationPage = lazy(() => import("@prescription/PrescriptionValidationPage"));
const TechnicianDashboard = lazy(() => import("@auth/TechnicianDashboard"));
const LabelGeneration = lazy(() => import("@prescription/LabelGeneration"));
const Refill = lazy(() => import("@prescription/Refill"));
const PrescriptionHistory = lazy(() => import("@prescription/PrescriptionHistory"));
const PatientProfile = lazy(() => import("@patient/PatientProfile"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        <Route element={<ProtectedRoute allowedRoles={["Manager"]} />}>
          <Route path={ROUTES.MANAGER.BASE} element={<AppLayout />}>
            <Route path="dashboard" element={<div>Manager Dashboard</div>} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["Pharmacist"]} />}>
          <Route path={ROUTES.PHARMACIST.BASE} element={<AppLayout />}>
            <Route index element={<PharmacistDashboard />} />
            <Route path="dashboard" element={<PharmacistDashboard />} />
            <Route path="entry" element={<ManualPrescriptionView />} />
            <Route path="validation" element={<PrescriptionValidationPage />} />
            <Route path="labels" element={<LabelGeneration />} />
            <Route path="refills" element={<Refill />} />
            <Route path="history" element={<PrescriptionHistory />} />
            <Route path="profiles" element={<PatientProfile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["Technician"]} />}>
          <Route path={ROUTES.TECHNICIAN.BASE} element={<AppLayout />}>
            <Route path="dashboard" element={<TechnicianDashboard />} />
          </Route>
        </Route>

        <Route
          path={ROUTES.FALLBACK}
          element={<Navigate to={ROUTES.LOGIN} replace />}
        />
      </Routes>
    </Suspense>
  );
}
