import { useState } from "react";
import Sidebar from "../components/layouts/Sidebar";
import TopNavbar from "../components/common/TopNavBar";
import DashboardView from "../modules/pharmacist/DashboardView";
import ManualPrescriptionView from "../modules/pharmacist/ManualPrescriptionView";

export default function PharmasictDashboard() {
  const [activeView, setActiveView] = useState("dashboard");

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar
        role="Pharmacist"
        activeKey={activeView}
        onSelect={setActiveView}
      />

      {/* Right Side */}
      <div className="flex-1 flex flex-col">
        <TopNavbar />

        <main className="flex-1 overflow-y-auto p-6">
          {activeView === "dashboard" && (
            <DashboardView
              onAddPrescription={() => setActiveView("entry")}
            />
          )}

          {activeView === "entry" && (
            <ManualPrescriptionView
              onProceed={() => setActiveView("validation")}
            />
          )}

          {activeView === "validation" && (
            <h1 className="text-2xl font-semibold">
              Validation Queue
            </h1>
          )}

          {activeView === "clinical" && (
            <h1 className="text-2xl font-semibold">
              Clinical Check
            </h1>
          )}

          {activeView === "label" && (
            <h1 className="text-2xl font-semibold">
              Label Generation
            </h1>
          )}

          {activeView === "refills" && (
            <h1 className="text-2xl font-semibold">
              Refill Management
            </h1>
          )}

          {activeView === "history" && (
            <h1 className="text-2xl font-semibold">
              Patient History
            </h1>
          )}

          {activeView === "alerts" && (
            <h1 className="text-2xl font-semibold">
              Alerts & Reminders
            </h1>
          )}
        </main>
      </div>
    </div>
  );
}
