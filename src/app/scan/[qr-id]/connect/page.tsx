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

export default function ConnectPage({ params }: { params: { "qr-id": string } }) {
  const router = useRouter();
  const qrString = params["qr-id"];

  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [email, setEmail] = useState("");
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const storedName = sessionStorage.getItem("scanner_name");
    const storedEmail = sessionStorage.getItem("scanner_email");
    const storedVehicle = sessionStorage.getItem("vehicle_data");

    if (!storedName || !storedEmail || !storedVehicle) {
      // If data not found, redirect back to form
      router.push(`/scan/${qrString}`);
      return;
    }

    setEmail(storedEmail);
    setVehicle(JSON.parse(storedVehicle));
  }, [qrString, router]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendAlert = async () => {
    if (alertLoading || cooldown > 0) return;
    setAlertLoading(true);

    try {
      const res = await fetch(`/api/scan/${qrString}/alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scannerPhone: email, scannerName: sessionStorage.getItem("scanner_name") }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to send alert");
        setAlertLoading(false);
        return;
      }

      setAlertSent(true);
      setCooldown(240); // 4 minute cooldown
      setAlertLoading(false);

      // Navigate to waiting page
      router.push(`/scan/${qrString}/waiting?alertId=${data.alertId}&scanId=${data.scanId}`);
    } catch {
      alert("Something went wrong. Please try again.");
      setAlertLoading(false);
    }
  };

  const handleOpenChat = async () => {
    // Create a scan log for chat
    try {
      const res = await fetch(`/api/scan/${qrString}/alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scannerPhone: email, scannerName: sessionStorage.getItem("scanner_name"), contactMethod: "chat" }),
      });
      const data = await res.json();
      if (res.ok && data.scanId) {
        router.push(`/chat/${data.scanId}?role=scanner`);
        return;
      }
    } catch {
      // fallback
    }
    alert("Unable to start chat. Please try again.");
  };

  const formatCooldown = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  if (!vehicle) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>P</div>
            <span style={styles.logoText}>ParkPing</span>
          </div>
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ ...styles.spinner }} />
            <p style={{ color: "#888", marginTop: 16, fontSize: 14 }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>P</div>
          <span style={styles.logoText}>ParkPing</span>
        </div>

        <div style={styles.vehicleBanner}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
            {vehicle.make} {vehicle.model}
          </h2>
          <p style={{ color: "#ccc", fontSize: 14 }}>{vehicle.color || ""}</p>
        </div>

        <div style={{ padding: "24px 20px" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, textAlign: "center", color: "#1A1A2E", marginBottom: 6 }}>
            Contact the Owner
          </h3>
          <p style={{ fontSize: 13, color: "#888", textAlign: "center", marginBottom: 24 }}>
            Choose how you&apos;d like to reach the car owner
          </p>

          {/* Alert Button */}
          <button
            onClick={handleSendAlert}
            disabled={alertLoading || cooldown > 0}
            style={{
              ...styles.primaryBtn,
              opacity: alertLoading || cooldown > 0 ? 0.6 : 1,
              marginBottom: 12,
              height: 64,
              fontSize: 17,
            }}
          >
            {alertLoading ? "Sending..." : cooldown > 0 ? `Next alert in ${formatCooldown(cooldown)}` : "🔔 Send Alert"}
            {!alertLoading && cooldown <= 0 && (
              <span style={{ display: "block", fontSize: 12, opacity: 0.8, marginTop: 2 }}>Notify owner instantly via push notification</span>
            )}
          </button>

          {/* Chat Button */}
          <button onClick={handleOpenChat} style={{ ...styles.secondaryBtn, height: 64, fontSize: 17 }}>
            💬 Send Message
            <span style={{ display: "block", fontSize: 12, opacity: 0.8, marginTop: 2 }}>Chat anonymously with owner</span>
          </button>

          {alertSent && (
            <div style={{ marginTop: 16, padding: "12px 16px", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
              <p style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>✅ Alert sent successfully! The owner has been notified.</p>
            </div>
          )}
        </div>

        <p style={styles.disclaimer}>🛡️ Misuse of this service is logged and punishable.</p>
      </div>
    </div>
  );
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