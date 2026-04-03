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

  const [page, setPage] = useState<"loading" | "notfound" | "nocode" | "email" | "actions">("loading");
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [email, setEmail] = useState("");
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);

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
        setPage("email");
      })
      .catch(() => setPage("notfound"));
  }, [code]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldownSec <= 0) return;
    const t = setInterval(() => setCooldownSec((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldownSec]);

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    sessionStorage.setItem("scanner_email", email);
    setPage("actions");
  };

  const sendAlert = async () => {
    if (alertLoading || cooldownSec > 0) return;
    setAlertLoading(true);
    try {
      const r = await fetch(`/api/scan/${code}/alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scannerPhone: email }),
      });
      const d = await r.json();
      if (!r.ok) { alert(d.error || "Failed"); setAlertLoading(false); return; }
      setAlertSent(true);
      setCooldownSec(240);
      setAlertLoading(false);
      router.push(`/scan/waiting?alertId=${d.alertId}&scanId=${d.scanId}&code=${code}`);
    } catch {
      alert("Something went wrong.");
      setAlertLoading(false);
    }
  };

  const openChat = async () => {
    try {
      const r = await fetch(`/api/scan/${code}/alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scannerPhone: email, contactMethod: "chat" }),
      });
      const d = await r.json();
      if (r.ok && d.scanId) {
        router.push(`/chat/${d.scanId}?role=scanner`);
        return;
      }
    } catch { /* fallback */ }
    alert("Unable to start chat.");
  };

  const fmtCooldown = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

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

  // ─── EMAIL ──────────────────────────────────
  if (page === "email") return (
    <div style={S.page}><div style={S.card}>
      <Header />
      <VehicleBanner />
      <div style={{ padding: "28px 24px" }}>
        <h3 style={{ fontSize: 19, fontWeight: 700, color: "#1A1A2E", marginBottom: 6 }}>Enter your email to proceed</h3>
        <p style={{ fontSize: 13, color: "#999", marginBottom: 24, lineHeight: 1.6 }}>
          Just for identification. The car owner will <b>never</b> see your email.
        </p>
        <form onSubmit={submitEmail}>
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

  // ─── ACTIONS ────────────────────────────────
  return (
    <div style={S.page}><div style={S.card}>
      <Header />
      <VehicleBanner />
      <div style={{ padding: "28px 24px" }}>
        <h3 style={{ fontSize: 19, fontWeight: 700, textAlign: "center", color: "#1A1A2E", marginBottom: 4 }}>Contact the Owner</h3>
        <p style={{ fontSize: 13, color: "#999", textAlign: "center", marginBottom: 28 }}>Choose how you&apos;d like to reach them</p>

        {/* ALERT BUTTON */}
        <button
          onClick={sendAlert}
          disabled={alertLoading || cooldownSec > 0}
          style={{ ...S.orangeBtn, height: 72, fontSize: 18, marginBottom: 14, opacity: (alertLoading || cooldownSec > 0) ? 0.5 : 1 }}
        >
          <span style={{ display: "block" }}>
            {alertLoading ? "Sending..." : cooldownSec > 0 ? `⏳ Next alert in ${fmtCooldown(cooldownSec)}` : "🔔  Send Alert"}
          </span>
          {!alertLoading && cooldownSec <= 0 && (
            <span style={{ display: "block", fontSize: 12, opacity: 0.85, marginTop: 4, fontWeight: 400 }}>Instantly notifies the car owner</span>
          )}
        </button>

        {/* CHAT BUTTON */}
        <button onClick={openChat} style={{ ...S.navyBtn, height: 72, fontSize: 18 }}>
          <span style={{ display: "block" }}>💬  Send Message</span>
          <span style={{ display: "block", fontSize: 12, opacity: 0.85, marginTop: 4, fontWeight: 400 }}>Chat anonymously with the owner</span>
        </button>

        {alertSent && (
          <div style={{ marginTop: 20, padding: "14px 18px", background: "#f0fdf4", borderRadius: 14, border: "1px solid #bbf7d0" }}>
            <p style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>✅ Alert sent! The owner has been notified.</p>
          </div>
        )}
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
