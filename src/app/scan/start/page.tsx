"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ScanStartPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.includes("@")) {
      setError("Please enter a valid name and email.");
      return;
    }

    sessionStorage.setItem("scanner_name", name.trim());
    sessionStorage.setItem("scanner_email", email.trim());
    setError("");
    router.push("/scan/camera");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: 24, boxShadow: "0 12px 30px rgba(0,0,0,0.08)", padding: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Scan a QR</h1>
        <p style={{ color: "#64748b", marginBottom: 20 }}>Enter your details first. Next you can open the camera to scan the code and connect to the owner.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}
          />
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}
          />
          {error && <p style={{ color: "#dc2626", marginBottom: 12 }}>{error}</p>}
          <button type="submit" style={{ width: "100%", background: "#ff6b35", border: "none", color: "#fff", fontSize: 16, fontWeight: 700, borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}>
            Proceed to scan
          </button>
        </form>
      </div>
    </div>
  );
}
