// import { BrowserRouter } from "react-router-dom";
// import { AppRoutes } from "./routes/AppRoutes";
// import './index.css';

// export default function App() {
//   return (
//     <BrowserRouter>
//       <AppRoutes />
//     </BrowserRouter>
//   );
// }
// src/App.tsx
import { Provider, useSelector } from "react-redux";
import { store } from "./store";
import type { RootState }  from "./store";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import Sidebar from "./components/layouts/Sidebar";
import LoginPage from "./pages/LoginPage";

function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useSelector((s: RootState) => s.auth.user);
  return (
    <div className="flex min-h-screen">
      {user && <Sidebar user={{ id: user.id, name: user.username, role: user.role }} />}
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute allowedRoles={["Manager"]} />}>
            <Route path="/manager/*" element={<AppLayout>{/* Manager pages */}</AppLayout>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Pharmacist"]} />}>
            <Route path="/pharmacist/*" element={<AppLayout>{/* Pharmacist pages */}</AppLayout>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Technician"]} />}>
            <Route path="/technician/*" element={<AppLayout>{/* Technician pages */}</AppLayout>} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}
