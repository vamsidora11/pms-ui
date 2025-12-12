import { Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";



export default function AppRoutes() {
  return (
    <Routes>
      {/* Login Route */}
      <Route path="/login" element={<LoginPage />} />
     

      {/* Default Route Redirect */}
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}
