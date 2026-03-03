import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "@components/layouts/Applayout/Applayout";
import { ROUTES } from "../constants/routes";
import { lazy, Suspense } from "react";

const LoginPage = lazy(() => import("@auth/components/LoginPage"));
const PharmacistDashboard = lazy(() => import("@auth/components/PharmacistDashboard"));

const PrescriptionValidationQueue = lazy(() => import("@validation/PrescriptionValidationQueue"));
const PrescriptionValidationPage  = lazy(() => import("@validation/PrescriptionValidationPage"));

const ManualPrescriptionView = lazy(() => import("@prescription/PrescriptionEntry"));

// ── Technician — moved from @auth/components into their own feature folder
const TechnicianDashboard = lazy(() => import("@technician/TechnicianDashboard"));
const InventoryManagement = lazy(() => import("@technician/inventory/InventoryManagement")); 

const LabelGeneration     = lazy(() => import("@labels/components/LabelGeneration"));
const Refill              = lazy(() => import("@refill/Refill"));
const PrescriptionHistory = lazy(() => import("@prescription/PrescriptionHistory"));
const PatientProfile      = lazy(() => import("@patient/components/PatientProfile"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* ── Manager ── */}
        <Route element={<ProtectedRoute allowedRoles={["manager"]} />}>
          <Route path={ROUTES.MANAGER.BASE} element={<AppLayout />}>
            <Route path="dashboard" element={<div>Manager Dashboard</div>} />
          </Route>
        </Route>

        {/* ── Pharmacist ── */}
        <Route element={<ProtectedRoute allowedRoles={["pharmacist"]} />}>
          <Route path={ROUTES.PHARMACIST.BASE} element={<AppLayout />}>
            <Route index element={<PharmacistDashboard />} />
            <Route path="dashboard"        element={<PharmacistDashboard />} />
            <Route path="entry"            element={<ManualPrescriptionView />} />
            <Route path="validation"       element={<PrescriptionValidationQueue />} />
            <Route path="validation/:rxId" element={<PrescriptionValidationPage />} />
            <Route path="labels"           element={<LabelGeneration />} />
            <Route path="refills"          element={<Refill />} />
            <Route path="history"          element={<PrescriptionHistory />} />
            <Route path="profiles"         element={<PatientProfile />} />
          </Route>
        </Route>

        {/* ── Technician ── */}
        <Route element={<ProtectedRoute allowedRoles={["technician"]} />}>
          <Route path={ROUTES.TECHNICIAN.BASE} element={<AppLayout />}>
            <Route path="dashboard" element={<TechnicianDashboard />} />
            <Route path="inventory" element={<InventoryManagement />} /> {/* ← NEW */}
          </Route>
        </Route>

        <Route path={ROUTES.FALLBACK} element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </Suspense>
  );
}