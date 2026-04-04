"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SonarPing } from "@/components/ui/SonarPing";
import { Button } from "@/components/ui/Button";
import { X, CheckCircle2, Clock, MessageCircle, BellRing } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function WaitingPage({ params }: { params: { "qr-id": string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const alertId = searchParams.get("alertId");
  const scanId = searchParams.get("scanId");
  const qrString = params["qr-id"];

  const [status, setStatus] = useState<"waiting" | "coming" | "busy" | "expired" | "no_response_timeout">("waiting");
  const [eta, setEta] = useState<number | null>(null);
  const [busyReason, setBusyReason] = useState<string | null>(null);
  const [minutesAgo, setMinutesAgo] = useState(0);
  const [secondsWaited, setSecondsWaited] = useState(0);
  const [startTime] = useState(Date.now());

  // Timer for "Sent X minutes ago"
  useEffect(() => {
    const interval = setInterval(() => {
      setMinutesAgo(Math.floor((Date.now() - startTime) / 60000));
    }, 10000);
    return () => clearInterval(interval);
  }, [startTime]);

  // 30-second timeout for showing chat button
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsWaited((s) => {
        const newSeconds = s + 1;
        if (newSeconds === 30 && status === "waiting") {
          setStatus("no_response_timeout");
        }
        return newSeconds;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // 10-minute timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (status === "waiting") setStatus("expired");
    }, 10 * 60 * 1000);
    return () => clearTimeout(timeout);
  }, [status]);

  // Supabase Realtime subscription
  const subscribeToAlerts = useCallback(() => {
    if (!alertId) return;
    const supabase = createClient();

    const channel = supabase
      .channel("alert-" + alertId)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "alerts",
          filter: "id=eq." + alertId,
        },
        (payload: { new: Record<string, unknown> }) => {
          const updated = payload.new as { status: string; eta_minutes?: number; owner_response?: string };
          if (updated.status === "coming") {
            setStatus("coming");
            setEta(updated.eta_minutes || null);
          } else if (updated.status === "busy") {
            setStatus("busy");
            setBusyReason(updated.owner_response || null);
          } else if (updated.status === "chatting") {
            router.push(`/chat/${scanId}?role=scanner`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [alertId, scanId, router]);

  useEffect(() => {
    const cleanup = subscribeToAlerts();
    return () => { cleanup?.(); };
  }, [subscribeToAlerts]);

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden min-h-[500px] flex flex-col relative">
        <button
          onClick={() => router.push("/")}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 z-10 p-2"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center pt-8">

          {status === "waiting" && (
            <div className="animate-in fade-in duration-500 flex flex-col items-center">
              <h2 className="text-2xl font-bold text-secondary mb-2">Alert Sent! ✅</h2>
              <p className="text-gray-500 font-medium max-w-xs">
                We&apos;ve notified the owner via a high-priority push notification.
              </p>
              <SonarPing />
              <p className="text-sm font-semibold text-primary animate-pulse mt-4">
                Waiting for their response...
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-4">
                <Clock className="w-3.5 h-3.5" />
                <span>Sent {minutesAgo === 0 ? "just now" : `${minutesAgo} min ago`}</span>
              </div>
            </div>
          )}

          {status === "coming" && (
            <div className="animate-in slide-in-from-bottom flex flex-col items-center">
              <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Owner is on the way! 🎉</h2>
              <p className="text-gray-500 text-lg mb-8">Please wait near your vehicle.</p>

              {eta && (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 w-full mb-8">
                  <p className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-2">Estimated Arrival</p>
                  <p className="text-4xl font-extrabold text-secondary">{eta} <span className="text-xl">min</span></p>
                </div>
              )}

              <Button variant="outline" className="w-full h-14" onClick={() => router.push("/")}>
                Done — Go to ParkPing
              </Button>
            </div>
          )}

          {status === "busy" && (
            <div className="animate-in fade-in flex flex-col items-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-10 h-10 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Owner is currently unavailable 😔</h2>
              {busyReason && (
                <p className="text-gray-500 mb-4 italic">&quot;{busyReason}&quot;</p>
              )}
              <p className="text-gray-500 mb-8 max-w-xs">You can try again later or send them a message.</p>
              <div className="space-y-3 w-full">
                <Button
                  className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => router.push(`/scan/${qrString}`)}
                >
                  <BellRing className="mr-2 w-5 h-5" /> Send Another Alert
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-14"
                  onClick={() => router.push(`/chat/${scanId}?role=scanner`)}
                >
                  <MessageCircle className="mr-2 w-5 h-5" /> Send a Message
                </Button>
              </div>
            </div>
          )}

          {status === "expired" && (
            <div className="animate-in fade-in flex flex-col items-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No response yet</h2>
              <p className="text-gray-500 mb-8 max-w-xs">The owner hasn&apos;t responded within 10 minutes.</p>
              <div className="space-y-3 w-full">
                <Button
                  className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => router.push(`/scan/${qrString}`)}
                >
                  <BellRing className="mr-2 w-5 h-5" /> Send Another Alert
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-14"
                  onClick={() => router.push(`/chat/${scanId}?role=scanner`)}
                >
                  <MessageCircle className="mr-2 w-5 h-5" /> Leave a Message
                </Button>
              </div>
            </div>
          )}

          {status === "no_response_timeout" && (
            <div className="animate-in fade-in flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <MessageCircle className="w-10 h-10 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No response yet 🤔</h2>
              <p className="text-gray-500 mb-8 max-w-xs">The owner hasn&apos;t responded in 30 seconds. Would you like to send them a direct message?</p>
              <div className="space-y-3 w-full">
                <Button
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => router.push(`/chat/${scanId}?role=scanner`)}
                >
                  <MessageCircle className="mr-2 w-5 h-5" /> Chat with Owner 💬
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-14"
                  onClick={() => setStatus("waiting")}
                >
                  Keep Waiting
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
