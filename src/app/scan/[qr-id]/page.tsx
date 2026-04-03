"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BellRing, MessageCircle, ShieldAlert, Car } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { CooldownTimer } from "@/components/ui/CooldownTimer";
import { formatPhone } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastProvider";
import { createClient } from "@/lib/supabase/client";

interface VehicleInfo {
  make: string;
  model: string;
  color: string | null;
  qr_code_id: string;
  vehicle_id: string;
}

export default function ScanPage({ params }: { params: { "qr-id": string } }) {
  const router = useRouter();
  const toast = useToast();
  const qrString = params["qr-id"];

  const [step, setStep] = useState<"loading" | "notfound" | "phone" | "actions">("loading");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [onCooldown, setOnCooldown] = useState(false);
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [alertCount, setAlertCount] = useState(0);

  // Fetch vehicle data from qr_code_string
  const fetchVehicle = useCallback(async () => {
    const supabase = createClient();
    const { data: qrCode } = await supabase
      .from("qr_codes")
      .select("id, vehicle_id")
      .eq("qr_code_string", qrString)
      .single();

    if (!qrCode) {
      setStep("notfound");
      return;
    }

    const { data: veh } = await supabase
      .from("vehicles")
      .select("make, model, color")
      .eq("id", qrCode.vehicle_id)
      .single();

    if (!veh) {
      setStep("notfound");
      return;
    }

    setVehicle({
      make: veh.make,
      model: veh.model,
      color: veh.color,
      qr_code_id: qrCode.id,
      vehicle_id: qrCode.vehicle_id,
    });
    setStep("phone");
  }, [qrString]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\s/g, "");
    if (cleanPhone.length < 10) {
      return toast("Enter a valid 10-digit number", "error");
    }
    // Store phone in sessionStorage for this scan session
    sessionStorage.setItem("scanner_phone", cleanPhone);
    setStep("actions");
  };

  const handleSendAlert = async () => {
    if (onCooldown || alertCount >= 3) {
      return toast("Please wait before sending another alert.", "error");
    }

    setLoading(true);
    const scannerPhone = sessionStorage.getItem("scanner_phone") || phone.replace(/\s/g, "");

    try {
      const res = await fetch(`/api/scan/${qrString}/alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scannerPhone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send alert");

      setAlertCount((c) => c + 1);
      setOnCooldown(true);
      toast("Alert sent to the car owner! 🔔", "success");
      router.push(`/scan/${qrString}/waiting?alertId=${data.alertId}&scanId=${data.scanId}`);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to send alert", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    const scannerPhone = sessionStorage.getItem("scanner_phone") || phone.replace(/\s/g, "");
    if (!scannerPhone) {
      toast("Please enter your phone number first", "error");
      setStep("phone");
      return;
    }
    // Navigate to chat — we'll create the scan_log entry when first message is sent
    router.push(`/scan/${qrString}/chat?phone=${encodeURIComponent(scannerPhone)}`);
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (step === "notfound") {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center justify-center">
        <Card className="max-w-md w-full shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">QR Code Not Found</h2>
          <p className="text-gray-500 mb-6">This QR code is not registered with ParkPing or may have expired.</p>
          <Button onClick={() => router.push("/")} variant="outline" className="w-full">
            Go to ParkPing Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center">
      {/* Brand Watermark */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-xl">
          P
        </div>
        <span className="font-bold text-xl tracking-tight text-secondary">ParkPing</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl overflow-hidden mb-6">
          {/* Vehicle Header */}
          <div className="bg-secondary px-6 py-8 text-center text-white">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Car className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-semibold">You scanned a ParkPing sticker</p>
            <h2 className="text-xl font-bold mb-1">{vehicle?.make} {vehicle?.model}</h2>
            <p className="text-gray-300 font-medium">{vehicle?.color || "Color not specified"}</p>
          </div>

          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {step === "phone" && (
                <motion.div key="phone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Enter your phone number</h3>
                  <p className="text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">
                    For security purposes only. The car owner will <strong>NOT</strong> see your number.
                  </p>

                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div className="relative rounded-xl shadow-sm border border-gray-200 bg-white focus-within:ring-primary focus-within:border-primary">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none gap-2">
                        <span className="text-gray-500 font-medium">+91</span>
                        <div className="h-4 w-px bg-gray-200 ml-1" />
                      </div>
                      <input
                        type="tel"
                        className="pl-20 block w-full outline-none py-4 bg-transparent font-medium"
                        placeholder="Enter mobile number"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value).replace("+91 ", ""))}
                        maxLength={11}
                      />
                    </div>
                    <Button type="submit" className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white">Continue →</Button>
                  </form>
                </motion.div>
              )}

              {step === "actions" && (
                <motion.div key="actions" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Contact the Owner</h3>
                  <p className="text-sm text-gray-500 text-center mb-6">Choose how you&apos;d like to reach the car owner</p>

                  <div className="space-y-4">
                    <Button
                      className="w-full h-16 text-lg bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={handleSendAlert}
                      disabled={onCooldown || loading}
                      isLoading={loading}
                    >
                      <BellRing className="mr-2 w-5 h-5" /> Send Alert
                      <span className="block text-xs opacity-80 ml-1">• Notify owner instantly</span>
                    </Button>

                    <Button
                      className="w-full h-16 text-lg bg-secondary hover:bg-secondary-hover text-white"
                      onClick={handleSendMessage}
                    >
                      <MessageCircle className="mr-2 w-5 h-5" /> Send Message
                      <span className="block text-xs opacity-80 ml-1">• Chat anonymously</span>
                    </Button>
                  </div>

                  {onCooldown && <CooldownTimer initialSeconds={240} onComplete={() => setOnCooldown(false)} />}
                  {alertCount >= 3 && (
                    <p className="text-center text-sm text-red-500 mt-4 font-medium">Maximum 3 alerts per hour reached.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="text-center text-xs font-medium text-gray-400 flex items-center justify-center gap-1.5 mt-8">
          <ShieldAlert className="w-4 h-4" /> Misuse of this service is logged and punishable.
        </p>
      </motion.div>
    </div>
  );
}
