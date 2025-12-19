import { Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import TechnicianDashboard from "../pages/TechnicianDashboard";
import PharmacistDashboard from "../pages/PharmacistDashboard";


export default function AppRoutes() {
  return (
    <Routes>
       {/* Default Home Route → Login */}
      <Route path="/" element={<LoginPage />} />  
      {/* Login Route */}
      <Route path="/login" element={<LoginPage />} />
           {/* Technician Dashboard */}
      <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
      <Route path ="/pharmacist/dashboard" element ={<PharmacistDashboard />}/>

      {/* Default Route Redirect */}
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}
