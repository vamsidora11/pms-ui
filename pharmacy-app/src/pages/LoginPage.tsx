import React, { useState } from "react";
import { useNavigate } from "react-router-dom";   // ✅ Added
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import LoginImage from "../assets/Login.png";

export default function LoginPage() {
  const navigate = useNavigate();   // ✅ Added

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic check (replace with real authentication later)
    if (email && password) {
      navigate("/pharmacist/dashboard");   // ✅ Redirect after login
    } else {
      alert("Please enter valid credentials");
    }
  };

  return (
    <div className="flex w-screen h-screen">

      {/* LEFT SECTION */}
      <div className="w-[50%] bg-gray-200 border-r-2 border-blue-500 flex justify-center items-center">
        
        {/* CARD */}
        <form onSubmit={handleLogin} className="bg-white shadow-lg rounded-xl p-10 w-[65%]">
          <h1 className="text-3xl font-semibold text-center mb-8">Login</h1>

          <div className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"  // ✅ Form submission triggers navigation
              className="w-full justify-center mt-4"
            >
              Sign In
            </Button>
          </div>
        </form>
      </div>

      {/* RIGHT SECTION WITH IMAGE */}
      <div className="w-[50%] bg-white flex justify-center items-center overflow-hidden">
        <img
          src={LoginImage}
          alt="Login Illustration"
          className="w-full h-full object-cover"
        />
      </div>

    </div>
  );
}
