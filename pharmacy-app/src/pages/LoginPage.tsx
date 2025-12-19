// <<<<<<< HEAD
// import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import Input from "../components/common/Input";
// import Button from "../components/common/Button";
// import LoginImage from "../assets/Login.png"; 
// import { loginUser } from "../store/authSlice";
// import type { AppDispatch, RootState } from "../store";

// export default function LoginPage() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();

//   const { status, error } = useSelector((s: RootState) => s.auth);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const result = await dispatch(loginUser({ username: email, password }));

//     if (loginUser.fulfilled.match(result)) {
//       navigate("/prescriptions"); // ✅ redirect on success
//     }
//   };

//   return (
//     <div className="flex w-screen h-screen">
//       {/* LEFT SECTION */}
//       <div className="w-[50%] bg-gray-200 border-r-2 border-blue-500 flex justify-center items-center">
//         {/* CARD */}
//         <div className="bg-white shadow-lg rounded-xl p-10 w-[65%]">
//           <h1 className="text-3xl font-semibold text-center mb-8">Login</h1>

//           <form onSubmit={handleSubmit} className="space-y-6">
//             <Input
//               label="Email Address"
//               type="email"
//               placeholder="Enter your email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//             />

//             <Input
//               label="Password"
//               type="password"
//               placeholder="Enter your password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//             />

//             {error && (
//               <p className="text-red-500 text-sm text-center">{error}</p>
//             )}

//             <Button
//               type="submit"
//               disabled={status === "loading"}
//               className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
//             >
//               {status === "loading" ? "Signing In..." : "Sign In"}
//             </Button>
//           </form>
//         </div>
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
// src/pages/LoginPage.tsx
// import { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { loginUser } from "../store/authSlice";
// import type { AppDispatch, RootState } from "../store";

// export default function LoginPage() {
//   const [username, setUsername] = useState("");
// =======
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";   // ✅ Added
// import Input from "../components/common/Input";
// import Button from "../components/common/Button";
// import LoginImage from "../assets/Login.png";

// export default function LoginPage() {
//   const navigate = useNavigate();   // ✅ Added

//   const [email, setEmail] = useState("");
// >>>>>>> dev
//   const [password, setPassword] = useState("");
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();
//   const { status, error, user } = useSelector((s: RootState) => s.auth);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const result = await dispatch(loginUser({ username, password }));
//     if (loginUser.fulfilled.match(result)) {
//       // redirect based on role
//       const role = user?.role;
//       const to =
//         role === "Manager"
//           ? "/manager/dashboard"
//           : role === "Pharmacist"
//           ? "/pharmacist/dashboard"
//           : "/technician/dashboard";
//       navigate(to);
//     }
//   };

//   const handleLogin = (e: React.FormEvent) => {
//     e.preventDefault();

//     // Basic check (replace with real authentication later)
//     if (email && password) {
//       navigate("/pharmacist/dashboard");   // ✅ Redirect after login
//     } else {
//       alert("Please enter valid credentials");
//     }
//   };

//   return (
// <<<<<<< HEAD
//     <div className="flex items-center justify-center min-h-screen bg-gray-100">
//       <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
//         <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Username</label>
//             <input
//               type="text"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
//               placeholder="Enter your username"
//               required
// =======
//     <div className="flex w-screen h-screen">

//       {/* LEFT SECTION */}
//       <div className="w-[50%] bg-gray-200 border-r-2 border-blue-500 flex justify-center items-center">
        
//         {/* CARD */}
//         <form onSubmit={handleLogin} className="bg-white shadow-lg rounded-xl p-10 w-[65%]">
//           <h1 className="text-3xl font-semibold text-center mb-8">Login</h1>

//           <div className="space-y-6">
//             <Input
//               label="Email Address"
//               type="email"
//               placeholder="Enter your email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
// >>>>>>> dev
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Password</label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
//               placeholder="Enter your password"
//               required
//             />
// <<<<<<< HEAD
//           </div>
//           <button
//             type="submit"
//             disabled={status === "loading"}
//             className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none"
//           >
//             {status === "loading" ? "Signing in..." : "Sign in"}
//           </button>
//           {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
//         </form>
//       </div>
// =======

//             <Button
//               type="submit"  // ✅ Form submission triggers navigation
//               className="w-full justify-center mt-4"
//             >
//               Sign In
//             </Button>
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

// >>>>>>> dev
//     </div>
//   );
// }
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../store/authSlice";
import type { AppDispatch, RootState } from "../store";

import Input from "../components/common/Input";
import Button from "../components/common/Button";
import LoginImage from "../assets/Login.png";

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { status, error, user } = useSelector((s: RootState) => s.auth);

  const [username, setUsername] = useState(""); // keep username for backend login
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
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
