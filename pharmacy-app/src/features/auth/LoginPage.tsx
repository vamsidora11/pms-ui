// import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { loginUser } from "@store/auth/authSlice";
// import type { AppDispatch, RootState } from "store";

// import Input from "@components/common/Input/Input";
// import Button from "@components/common/Button/Button";
// import LoginImage from "@assets/Login.png";

// export default function LoginPage() {
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();
//   const { status, error, user } = useSelector((s: RootState) => s.auth);

//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     const result = await dispatch(loginUser({ username, password }));
//     if (loginUser.fulfilled.match(result)) {
//       const role = user?.role;
//       const to =
//         role === "manager"
//           ? "/manager/dashboard"
//           : role === "pharmacist"
//           ? "/pharmacist/dashboard"
//           : "/technician/dashboard";
//       navigate(to);
//     }
//   };

//   return (
//     <div className="flex w-screen h-screen">
//       {/* LEFT SECTION */}
//       <div className="w-[50%] bg-gray-200 border-r-2 border-blue-500 flex justify-center items-center">
//         {/* CARD */}
//         <form
//           onSubmit={handleSubmit}
//           className="bg-white shadow-lg rounded-xl p-10 w-[65%]"
//         >
//           <h1 className="text-3xl font-semibold text-center mb-8">Login</h1>

//           <div className="space-y-6">
//             <Input
//               label="Username"
//               type="text"
//               placeholder="Enter your username"
//               value={username}
//               onChange={setUsername}
//               required
//             />

//             <Input
//               label="Password"
//               type="password"
//               placeholder="Enter your password"
//               value={password}
//               onChange={setPassword}
//               required
//             />

//             <Button
//               type="submit"
//               disabled={status === "loading"}
//               className="w-full justify-center mt-4"
//             >
//               {status === "loading" ? "Signing in..." : "Sign In"}
//             </Button>

//             {error && (
//               <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
//             )}
//           </div>
//         </form>
//       </div>

//       {/* RIGHT SECTION WITH IMAGE */}
//       <div className="w-[50%] bg-white flex justify-center items-center overflow-hidden">
//         <img
//           src={LoginImage}
//           alt="Login Illustration"
//           className="w-full h-full object-cover"
//         />
//       </div>
//     </div>
//   );
// }
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser } from "@store/auth/authSlice";
import type { AppDispatch, RootState } from "store";
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { status, error, user } = useSelector((s: RootState) => s.auth);
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // ✅ unwrap returns payload or throws rejectWithValue
      const res = await dispatch(loginUser({ username, password })).unwrap();

      toast.success("Login successful", `Welcome ${username}`);

      // ✅ decode token to get role immediately (no stale selector issue)
      const payload = jwtDecode<TokenPayload>(res.accessToken);
      const role = payload.role;

      const to =
        role === "manager"
          ? "/manager/dashboard"
          : role === "pharmacist"
          ? "/pharmacist/dashboard"
          : "/technician/dashboard";

      navigate(to);
    } catch (err: any) {
      const msg =
        typeof err === "string"
          ? err
          : "Incorrect username or password";

      toast.error("Login failed", msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
          {/* Logo */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full mb-6 shadow-lg">
              <svg
                className="w-12 h-12 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4.22 11.29l2.54-2.82c.42-.46 1.14-.48 1.58-.06l1.72 1.64c.44.42 1.15.4 1.58-.06l5.58-6.2c.42-.46 1.14-.48 1.58-.06.44.42.46 1.11.04 1.57l-6.28 6.98c-.42.46-1.14.48-1.58.06l-1.72-1.64c-.44-.42-1.15-.4-1.58.06l-3.24 3.6c-.42.46-1.14.48-1.58.06-.44-.43-.46-1.12-.04-1.57z" transform="rotate(45 12 12)"/>
                <rect x="6" y="10" width="12" height="8" rx="2" transform="rotate(45 12 14)"/>
              </svg>
            </div>
            <h1 className="text-3xl font-semibold text-blue-600 mb-2">MediFlow</h1>
            <p className="text-sm text-gray-500">Pharmacy Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={status === "loading"}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={status === "loading"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={status === "loading"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            {/* <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500"
                  disabled={status === "loading"}
                />
                <span className="text-sm text-gray-700">Remember me</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                Forgot password?
              </a>
            </div> */}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-medium rounded-xl hover:from-blue-700 hover:to-teal-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}