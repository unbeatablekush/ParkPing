"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface VehicleData {
  make: string;
  model: string;
  color: string | null;
  qr_code_id: string;
  vehicle_id: string;
}

export default function ScanPage({ params }: { params: { "qr-id": string } }) {
  const router = useRouter();
  const qrString = params["qr-id"];

  const [status, setStatus] = useState<"loading" | "notfound" | "form" | "actions">("loading");
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Fetch vehicle info via API
  useEffect(() => {
    fetch(`/api/scan/${qrString}/info`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => {
        setVehicle(data);
        setStatus("form");
      })
      .catch(() => {
        setStatus("notfound");
      });
  }, [qrString]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email || !email.includes("@")) return;
    sessionStorage.setItem("scanner_name", name.trim());
    sessionStorage.setItem("scanner_email", email);
    sessionStorage.setItem("vehicle_data", JSON.stringify(vehicle));
    router.push(`/scan/${qrString}/connect`);
  };

  // ─── LOADING ─────────────────────────────────
  if (status === "loading") {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>P</div>
            <span style={styles.logoText}>ParkPing</span>
          </div>
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ ...styles.spinner }} />
            <p style={{ color: "#888", marginTop: 16, fontSize: 14 }}>Loading vehicle details...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── NOT FOUND ───────────────────────────────
  if (status === "notfound") {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>P</div>
            <span style={styles.logoText}>ParkPing</span>
          </div>
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>QR Code Not Found</h2>
            <p style={{ color: "#888", fontSize: 14, lineHeight: 1.6 }}>
              This QR code is not registered with ParkPing or may have expired.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── FORM INPUT ─────────────────────────────
  if (status === "form") {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>P</div>
            <span style={styles.logoText}>ParkPing</span>
          </div>

          {/* Vehicle Info Banner */}
          <div style={styles.vehicleBanner}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#aaa", marginBottom: 8, fontWeight: 600 }}>
              You scanned a ParkPing sticker
            </p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              {vehicle?.make} {vehicle?.model}
            </h2>
            <p style={{ color: "#ccc", fontSize: 14 }}>{vehicle?.color || ""}</p>
          </div>

          {/* Name and Email Form */}
          <div style={{ padding: "24px 20px" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E", marginBottom: 6 }}>Enter your details</h3>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 1.5 }}>
              For security purposes only. The car owner will <strong>NOT</strong> see your information.
            </p>
            <form onSubmit={handleFormSubmit}>
              <input
                type="text"
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
              />
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
              <button type="submit" style={styles.primaryBtn}>
                Proceed →
              </button>
            </form>
          </div>

          <p style={styles.disclaimer}>🛡️ Misuse of this service is logged and punishable.</p>
        </div>
      </div>
    );
  }


}

// ─── INLINE STYLES (zero external dependencies) ──
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f7",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "24px 16px",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
    marginTop: 20,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "20px 0 10px 0",
  },
  logoIcon: {
    width: 32,
    height: 32,
    background: "#FF6B35",
    color: "#fff",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 18,
  },
  logoText: {
    fontWeight: 700,
    fontSize: 20,
    color: "#1A1A2E",
    letterSpacing: -0.5,
  },
  vehicleBanner: {
    background: "#1A1A2E",
    padding: "28px 24px",
    textAlign: "center" as const,
  },
  input: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    border: "1.5px solid #e5e5e5",
    padding: "0 16px",
    fontSize: 16,
    outline: "none",
    marginBottom: 16,
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  },
  primaryBtn: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    border: "none",
    background: "#FF6B35",
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity 0.2s",
  },
  secondaryBtn: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    border: "none",
    background: "#1A1A2E",
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  disclaimer: {
    fontSize: 11,
    color: "#aaa",
    textAlign: "center" as const,
    padding: "16px 20px 20px 20px",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #eee",
    borderTopColor: "#FF6B35",
    borderRadius: "50%",
    margin: "0 auto",
    animation: "spin 1s linear infinite",
  },
};
