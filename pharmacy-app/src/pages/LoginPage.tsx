import { useState } from "react";
import Input from "../components/common/Input";
import Checkbox from "../components/common/Checkbox";
import { Lock, Eye } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  return (
    <div className="p-6 max-w-sm mx-auto">

      {/* Inputs */}
      <Input
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        error={!email ? "Email is required" : ""}
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={<Lock size={18} />}
        rightIcon={<Eye size={18} />}
        required
      />

      {/* 1️⃣ Simple Checkbox */}
      <Checkbox
        label="Remember Me"
        checked={remember}
        onChange={(e) => setRemember(e.target.checked)}
      />

      
    </div>
  );
}
