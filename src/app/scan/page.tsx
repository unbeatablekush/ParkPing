"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface VehicleData {
  make: string;
  model: string;
  color: string | null;
  qr_code_id: string;
  vehicle_id: string;
}

function ScanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code") || "";

  const [page, setPage] = useState<"loading" | "notfound" | "nocode" | "form">("loading");
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // If no code in URL
  useEffect(() => {
    if (!code) {
      setPage("nocode");
      return;
    }
    // Fetch vehicle data from API
    fetch(`/api/scan/${code}/info`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((d) => {
        setVehicle(d);
        setPage("form");
      })
      .catch(() => setPage("notfound"));
  }, [code]);

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.includes("@")) return;
    sessionStorage.setItem("scanner_name", name.trim());
    sessionStorage.setItem("scanner_email", email);
    sessionStorage.setItem("vehicle_data", JSON.stringify(vehicle));
    router.push(`/scan/${code}/connect`);
  };

  // ─── SHARED HEADER ──────────────────────────
  const Header = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "20px 0 12px" }}>
      <div style={{ width: 34, height: 34, background: "#FF6B35", color: "#fff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18 }}>P</div>
      <span style={{ fontWeight: 700, fontSize: 21, color: "#1A1A2E", letterSpacing: -0.5 }}>ParkPing</span>
    </div>
  );

  const VehicleBanner = () => (
    <div style={{ background: "linear-gradient(135deg, #1A1A2E 0%, #2d2d4e 100%)", padding: "28px 24px", textAlign: "center" }}>
      <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 3, color: "#FF6B35", marginBottom: 10, fontWeight: 700 }}>Vehicle Found</p>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{vehicle?.make} {vehicle?.model}</h2>
      {vehicle?.color && <p style={{ color: "#aaa", fontSize: 14, fontWeight: 500 }}>{vehicle.color}</p>}
    </div>
  );

  // ─── LOADING ────────────────────────────────
  if (page === "loading") return (
    <div style={S.page}><div style={S.card}>
      <Header />
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ width: 44, height: 44, border: "4px solid #eee", borderTopColor: "#FF6B35", borderRadius: "50%", margin: "0 auto", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#999", marginTop: 18, fontSize: 14, fontWeight: 500 }}>Finding vehicle details...</p>
      </div>
    </div></div>
  );

  // ─── NO CODE ────────────────────────────────
  if (page === "nocode") return (
    <div style={S.page}><div style={S.card}>
      <Header />
      <div style={{ textAlign: "center", padding: "48px 24px" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📷</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>Scan a ParkPing QR Code</h2>
        <p style={{ color: "#999", fontSize: 14, lineHeight: 1.7 }}>Point your camera at a ParkPing sticker on a car windshield to get started.</p>
      </div>
    </div></div>
  );

  // ─── NOT FOUND ──────────────────────────────
  if (page === "notfound") return (
    <div style={S.page}><div style={S.card}>
      <Header />
      <div style={{ textAlign: "center", padding: "48px 24px" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>😔</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>QR Code Not Found</h2>
        <p style={{ color: "#999", fontSize: 14, lineHeight: 1.7 }}>This QR code is not registered with ParkPing or may have expired.</p>
      </div>
    </div></div>
  );

  // ─── FORM ──────────────────────────────────
  if (page === "form") return (
    <div style={S.page}><div style={S.card}>
      <Header />
      <VehicleBanner />
      <div style={{ padding: "28px 24px" }}>
        <h3 style={{ fontSize: 19, fontWeight: 700, color: "#1A1A2E", marginBottom: 6 }}>Enter your details to proceed</h3>
        <p style={{ fontSize: 13, color: "#999", marginBottom: 24, lineHeight: 1.6 }}>
          Just for identification. The car owner will <b>never</b> see your information.
        </p>
        <form onSubmit={submitForm}>
          <input
            type="text"
            required
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", height: 52, borderRadius: 14, border: "2px solid #e8e8e8", padding: "0 16px", fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 16 }}
          />
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", height: 52, borderRadius: 14, border: "2px solid #e8e8e8", padding: "0 16px", fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 16 }}
          />
          <button type="submit" style={{ ...S.orangeBtn, height: 52 }}>
            Proceed →
          </button>
        </form>
      </div>
      <p style={S.footer}>🛡️ Misuse is strictly logged and punishable</p>
    </div></div>
  );


}

// Wrap in Suspense for useSearchParams
export default function ScanPage() {
  return (
    <Suspense fallback={
      <div style={S.page}><div style={S.card}>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ color: "#999" }}>Loading...</p>
        </div>
      </div></div>
    }>
      <ScanContent />
    </Suspense>
  );
}

// ─── ALL STYLES INLINE ─────────────────────────
const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    display: "flex",
    justifyContent: "center",
    padding: "20px 16px",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    background: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    alignSelf: "flex-start",
    marginTop: 12,
  },
  orangeBtn: {
    width: "100%",
    borderRadius: 14,
    border: "none",
    background: "#FF6B35",
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  navyBtn: {
    width: "100%",
    borderRadius: 14,
    border: "none",
    background: "#1A1A2E",
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  footer: {
    fontSize: 11,
    color: "#bbb",
    textAlign: "center" as const,
    padding: "16px 20px 22px",
    fontWeight: 500,
  },
};
