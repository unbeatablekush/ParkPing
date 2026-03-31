"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, BellRing, MapPin, ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { OTPInput } from "@/components/ui/OTPInput";
import { CooldownTimer } from "@/components/ui/CooldownTimer";
import { formatPhone } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastProvider";

export default function ScanPage({ params }: { params: { "qr-id": string } }) {
  const router = useRouter();
  const toast = useToast();
  
  const [step, setStep] = useState<"verify" | "otp" | "actions">("verify");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [onCooldown, setOnCooldown] = useState(false);

  // Mock vehicle data found by QR ID
  const vehicle = {
    make: "Hyundai",
    model: "Creta",
    color: "Phantom Black",
    number: "KA 05 xx xxxx" // Masked for privacy on this screen
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return toast("Enter a valid 10-digit number", "error");
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
      toast("Verification code sent!", "success");
    }, 1000);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return toast("Enter 6-digit OTP", "error");
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("actions");
      toast("Identity verified successfully", "success");
    }, 1200);
  };

  const handleAction = (type: "call" | "alert") => {
    if (onCooldown) return toast("Please wait for cooldown to finish", "error");
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOnCooldown(true);
      if (type === "alert") {
        router.push(`/scan/${params["qr-id"]}/waiting`);
      } else {
        toast("Initiating secure proxy call...", "info");
      }
    }, 800);
  };

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
           <div className="bg-secondary px-6 py-8 text-center text-white">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                 <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-1">{vehicle.make} {vehicle.model}</h2>
              <p className="text-gray-300 font-medium">{vehicle.color}</p>
           </div>
           
           <CardContent className="p-6">
              <AnimatePresence mode="wait">
                {step === "verify" && (
                  <motion.div key="verify" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                     <h3 className="text-lg font-bold text-gray-900 mb-2">Verify it&apos;s you</h3>
                     <p className="text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">
                        To prevent spam, please verify your mobile number. The owner will <strong>NOT</strong> see your number.
                     </p>
                     
                     <form onSubmit={handleSendOTP} className="space-y-4">
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
                        <Button className="w-full h-12" isLoading={loading}>Verify Number</Button>
                     </form>
                  </motion.div>
                )}

                {step === "otp" && (
                  <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                     <button onClick={() => setStep("verify")} className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back
                     </button>
                     <p className="text-sm text-gray-500 mb-6">Enter the OTP sent to +91 {phone}</p>
                     
                     <form onSubmit={handleVerify} className="space-y-6">
                        <OTPInput length={6} value={otp} onChange={setOtp} disabled={loading} />
                        <Button className="w-full h-12" isLoading={loading}>Continue</Button>
                     </form>
                  </motion.div>
                )}

                {step === "actions" && (
                  <motion.div key="actions" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                     <h3 className="text-lg font-bold text-center text-gray-900 mb-6">Contact Owner</h3>
                     
                     <div className="space-y-4">
                        <Button 
                          className="w-full h-16 text-lg" 
                          variant="primary" 
                          onClick={() => handleAction("call")}
                          disabled={onCooldown}
                        >
                           <Phone className="mr-2" /> Anonymous Call
                        </Button>
                        <Button 
                          className="w-full h-16 text-lg bg-secondary hover:bg-secondary-hover text-white" 
                          onClick={() => handleAction("alert")}
                          disabled={onCooldown}
                        >
                           <BellRing className="mr-2" /> Send Urgent Alert
                        </Button>
                     </div>

                     {onCooldown && <CooldownTimer initialSeconds={240} onComplete={() => setOnCooldown(false)} />}
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
