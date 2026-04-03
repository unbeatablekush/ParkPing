"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function normalizeScanCode(raw: string) {
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    const fromQuery = parsed.searchParams.get("code");
    if (fromQuery) return fromQuery;

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      if (lastSegment.startsWith("qr_") || lastSegment.length > 5) {
        return lastSegment;
      }
    }
  } catch {
    // not a URL
  }
  return raw;
}

export default function ScanCameraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [err, setErr] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const scanLoop = async () => {
      if (!videoRef.current) return;
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setErr("Unable to start scanning.");
        return;
      }

      while (isScanning) {
        if (video.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          continue;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          if ("BarcodeDetector" in window) {
            // @ts-expect-error BarcodeDetector may not exist in TypeScript DOM lib yet
            const detector = new BarcodeDetector({ formats: ["qr_code"] });
            const results = await detector.detect(canvas);
            if (results.length > 0) {
              const raw = results[0].rawValue;
              if (raw) {
                setIsScanning(false);
                const stream = video.srcObject as MediaStream;
                stream.getTracks().forEach((track) => track.stop());
                const normalized = normalizeScanCode(raw);
                router.push(`/scan?code=${encodeURIComponent(normalized)}`);
                return;
              }
            }
          } else {
            ctx.getImageData(0, 0, canvas.width, canvas.height);
          }
        } catch {
          setErr("Scanning failed. Please use a modern browser or use manual input.");
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    };

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErr("Camera is not supported in this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsScanning(true);
          scanLoop();
        }
      } catch {
        setErr("Unable to access camera. Please check permissions.");
      }
    };

    startCamera();

    return () => {
      const currentVideo = videoRef.current;
      if (currentVideo?.srcObject) {
        (currentVideo.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
      setIsScanning(false);
    };
  }, [router, isScanning]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 460, background: "#fff", borderRadius: 24, boxShadow: "0 12px 30px rgba(0,0,0,0.08)", padding: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Scan QR Code</h1>
        <p style={{ color: "#64748b", marginBottom: 16 }}>Point the camera at the vehicle QR code. After successful scan, you’ll be connected to owner options.</p>
        <div style={{ width: "100%", borderRadius: 14, overflow: "hidden", background: "#000" }}>
          <video ref={videoRef} style={{ width: "100%", height: 360, objectFit: "cover" }} muted playsInline />
        </div>
        {err && <p style={{ marginTop: 14, color: "#dc2626" }}>{err}</p>}
        <button onClick={() => router.push('/scan/start')} style={{ marginTop: 14, width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff", fontWeight: 700 }}>Change details</button>
      </div>
    </div>
  );
}
