import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

import type { RootState } from "store";
import { useLoginFlow } from "./hooks/useLoginFlow"; // adjust path

export default function LoginPage() {
  const { status } = useSelector((s: RootState) => s.auth);
  const { login, errorMessage, clearError } = useLoginFlow();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isLoading = status === "loading";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  // shared input class (clean code)
  const inputClass =
    "w-full bg-white/80 border border-gray-200 rounded-xl " +
    "px-4 py-3 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] " +
    "transition-all duration-200 " +
    "hover:border-gray-300 hover:bg-white " +
    // ✅ Remove black outline + default ring
    "focus:outline-none focus:ring-0 " +
    // ✅ Add premium glow instead
    "focus:border-blue-500 " +
    "focus:shadow-[0_0_0_4px_rgba(59,130,246,0.18),0_10px_30px_-12px_rgba(20,184,166,0.35)] " +
    "disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background (premium soft gradient + blur blobs) */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50" />
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl border border-white/60 bg-white/75 backdrop-blur-xl p-8 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="mx-auto inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-teal-500 shadow-[0_18px_45px_-18px_rgba(20,184,166,0.7)]">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M4.22 11.29l2.54-2.82c.42-.46 1.14-.48 1.58-.06l1.72 1.64c.44.42 1.15.4 1.58-.06l5.58-6.2c.42-.46 1.14-.48 1.58-.06.44.42.46 1.11.04 1.57l-6.28 6.98c-.42.46-1.14.48-1.58.06l-1.72-1.64c-.44-.42-1.15-.4-1.58.06l-3.24 3.6c-.42.46-1.14.48-1.58.06-.44-.43-.46-1.12-.04-1.57z"
                  transform="rotate(45 12 12)"
                />
                <rect x="6" y="10" width="12" height="8" rx="2" transform="rotate(45 12 14)" />
              </svg>
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">
              MediFlow
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Pharmacy Management System
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) clearError();
                  }}
                  className={inputClass}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) clearError();
                  }}
                  className={`${inputClass} pr-12`}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Inline Error */}
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl py-3.5 font-medium text-white
                         bg-gradient-to-r from-blue-600 to-teal-500
                         shadow-[0_16px_45px_-18px_rgba(59,130,246,0.9)]
                         hover:from-blue-700 hover:to-teal-600
                         hover:shadow-[0_20px_55px_-20px_rgba(20,184,166,0.95)]
                         active:scale-[0.99]
                         transition-all duration-200
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            {/* Optional footer */}
            <p className="text-center text-xs text-slate-500">
              Secure login • Powered by MediFlow
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
