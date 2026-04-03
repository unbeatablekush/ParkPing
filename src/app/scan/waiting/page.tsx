"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function WaitingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const alertId = searchParams.get("alertId");
  const scanId = searchParams.get("scanId");
  const code = searchParams.get("code") || "";

  const [status, setStatus] = useState<"waiting" | "coming" | "busy" | "expired">("waiting");
  const [eta, setEta] = useState<number | null>(null);
  const [minutesAgo, setMinutesAgo] = useState(0);

  // Timer
  useEffect(() => {
    const start = Date.now();
    const i = setInterval(() => setMinutesAgo(Math.floor((Date.now() - start) / 60000)), 10000);
    return () => clearInterval(i);
  }, []);

  // 10 min timeout
  useEffect(() => {
    const t = setTimeout(() => { if (status === "waiting") setStatus("expired"); }, 600000);
    return () => clearTimeout(t);
  }, [status]);

  // Realtime listener
  useEffect(() => {
    if (!alertId) return;
    const supabase = createClient();
    const channel = supabase
      .channel("alert-" + alertId)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "alerts", filter: "id=eq." + alertId,
      }, (payload: { new: Record<string, unknown> }) => {
        const u = payload.new;
        if (u.status === "coming") { setStatus("coming"); setEta(u.eta_minutes as number || null); }
        else if (u.status === "busy") setStatus("busy");
        else if (u.status === "chatting") router.push(`/chat/${scanId}?role=scanner`);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [alertId, scanId, router]);

  const Header = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "20px 0 12px" }}>
      <div style={{ width: 34, height: 34, background: "#FF6B35", color: "#fff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18 }}>P</div>
      <span style={{ fontWeight: 700, fontSize: 21, color: "#1A1A2E" }}>ParkPing</span>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", justifyContent: "center", padding: "20px 16px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", alignSelf: "flex-start", marginTop: 12 }}>
        <Header />
        <div style={{ textAlign: "center", padding: "40px 24px 48px" }}>

          {status === "waiting" && <>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A2E", marginBottom: 8 }}>Alert Sent! ✅</h2>
            <p style={{ color: "#999", fontSize: 14, marginBottom: 32 }}>The owner has been notified. Waiting for response...</p>
            <div style={{ width: 80, height: 80, borderRadius: "50%", border: "4px solid #FF6B35", margin: "0 auto 24px", position: "relative", animation: "pulse-ring 2s ease-out infinite" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#FF6B35", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
            </div>
            <p style={{ fontSize: 13, color: "#bbb" }}>Sent {minutesAgo === 0 ? "just now" : `${minutesAgo} min ago`}</p>
          </>}

          {status === "coming" && <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1A1A2E", marginBottom: 8 }}>Owner is on the way!</h2>
            <p style={{ color: "#888", fontSize: 15, marginBottom: 24 }}>Please wait near your vehicle.</p>
            {eta && (
              <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: 16, marginBottom: 24, border: "1px solid #eee" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>ETA</p>
                <p style={{ fontSize: 40, fontWeight: 800, color: "#1A1A2E" }}>{eta} <span style={{ fontSize: 16, fontWeight: 500 }}>min</span></p>
              </div>
            )}
            <button onClick={() => router.push("/")} style={{ width: "100%", height: 48, borderRadius: 14, border: "2px solid #e5e5e5", background: "#fff", color: "#1A1A2E", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Done
            </button>
          </>}

          {status === "busy" && <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>😔</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>Owner is unavailable</h2>
            <p style={{ color: "#999", fontSize: 14, marginBottom: 28 }}>You can try again or leave a message.</p>
            <button onClick={() => router.push(`/scan?code=${code}`)} style={{ width: "100%", height: 52, borderRadius: 14, border: "none", background: "#FF6B35", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 12 }}>
              🔔 Send Another Alert
            </button>
            <button onClick={() => router.push(`/chat/${scanId}?role=scanner`)} style={{ width: "100%", height: 52, borderRadius: 14, border: "none", background: "#1A1A2E", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              💬 Send a Message
            </button>
          </>}

          {status === "expired" && <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⏰</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>No response yet</h2>
            <p style={{ color: "#999", fontSize: 14, marginBottom: 28 }}>The owner hasn&apos;t responded in 10 minutes.</p>
            <button onClick={() => router.push(`/scan?code=${code}`)} style={{ width: "100%", height: 52, borderRadius: 14, border: "none", background: "#FF6B35", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 12 }}>
              🔔 Try Again
            </button>
            <button onClick={() => router.push(`/chat/${scanId}?role=scanner`)} style={{ width: "100%", height: 52, borderRadius: 14, border: "none", background: "#1A1A2E", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              💬 Leave a Message
            </button>
          </>}
        </div>
      </div>
    </div>
  );
}

export default function WaitingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><p>Loading...</p></div>}>
      <WaitingContent />
    </Suspense>
  );
}
