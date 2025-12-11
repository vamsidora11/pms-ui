import React, { useState } from "react";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import LoginImage from "../assets/Login.png"; // <-- your image

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex w-screen h-screen">
      
      {/* LEFT SECTION */}
      <div className="w-[40%] bg-gray-200 border-r-2 border-blue-500 flex justify-center items-center">
        
        {/* CARD */}
        <div className="bg-white shadow-lg rounded-xl p-10 w-[75%]">
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

            <Button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
              Sign In
            </Button>
          </div>
        </div>

      </div>

      {/* RIGHT SECTION WITH IMAGE */}
      <div className="w-[60%] bg-white flex justify-center items-center overflow-hidden">
        <img 
          src={LoginImage} 
          alt="Login Illustration"
          className="max-w-full max-h-full object-contain"
        />
      </div>

    </div>
  );
}
