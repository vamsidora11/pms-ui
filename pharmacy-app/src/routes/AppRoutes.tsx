// import { Routes, Route } from "react-router-dom";
// import LoginPage from "../pages/LoginPage";



// export default function AppRoutes() {
//   return (
//     <Routes>
//       {/* Login Route */}
//       <Route path="/login" element={<LoginPage />} />
     

//       {/* Default Route Redirect */}
//       <Route path="*" element={<LoginPage />} />
//     </Routes>
//   );
// }

// import { Routes, Route } from "react-router-dom";
// import { PrescriptionsPage } from "../pages/PrescriptionListPage";

// export function AppRoutes() {
//   return (
//     <Routes>
//       <Route path="/" element={<PrescriptionsPage />} />
//     </Routes>
//   );
// }
// App routes: protect prescriptions route if not authenticated.
// Reasoning:
// - Redirect unauthenticated users to /login using Redux state.
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import { PrescriptionsPage } from "../pages/PrescriptionListPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/prescriptions" element={<PrescriptionsPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

