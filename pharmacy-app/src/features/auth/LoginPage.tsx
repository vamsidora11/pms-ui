import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../store/auth/authSlice";
import type { AppDispatch, RootState } from "../../store";

import Input from "../../components/common/Input/Input";
import Button from "../../components/common/Button/Button";
import LoginImage from "../../assets/Login.png";

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { status, error, user } = useSelector((s: RootState) => s.auth);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ username, password }));
    if (loginUser.fulfilled.match(result)) {
      const role = user?.role;
      const to =
        role === "Manager"
          ? "/manager/dashboard"
          : role === "Pharmacist"
          ? "/pharmacist/dashboard"
          : "/technician/dashboard";
      navigate(to);
    }
  };

  return (
    <div className="flex w-screen h-screen">
      {/* LEFT SECTION */}
      <div className="w-[50%] bg-gray-200 border-r-2 border-blue-500 flex justify-center items-center">
        {/* CARD */}
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-xl p-10 w-[65%]"
        >
          <h1 className="text-3xl font-semibold text-center mb-8">Login</h1>

          <div className="space-y-6">
            <Input
              label="Username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              disabled={status === "loading"}
              className="w-full justify-center mt-4"
            >
              {status === "loading" ? "Signing in..." : "Sign In"}
            </Button>

            {error && (
              <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
            )}
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
