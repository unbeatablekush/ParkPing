"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { OTPInput } from "@/components/ui/OTPInput";
import { formatPhone } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastProvider";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
    confirmationResult: ConfirmationResult | undefined;
  }
}

export default function AuthPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    // Clear dead instances (fixes 'reCAPTCHA client element has been removed' error on hot reloads)
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    } catch(e) {}

    window.recaptchaVerifier = new RecaptchaVerifier(
      auth, 
      'recaptcha-container', 
      { size: 'invisible' }
    );

    return () => {
      try {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = undefined;
        }
      } catch(e) {}
    };
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      toast("Please enter a valid 10-digit number", "error");
      return;
    }
    
    setLoading(true);
    try {
      const formattedPhone = `+91${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmation;
      
      setStep("otp");
      toast("OTP sent to your number!", "success");
    } catch (error) {
      console.error("Firebase SMS error:", error);
      toast("Failed to send OTP. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast("Please enter the complete 6-digit OTP", "error");
      return;
    }
    
    setLoading(true);
    try {
      if (!window.confirmationResult) {
        throw new Error("Missing confirmation payload");
      }
      
      const result = await window.confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();
      
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken, phone })
      });

      if (!res.ok) {
         throw new Error("Failed backend verification");
      }

      toast("Successfully verified!", "success");
      router.push("/dashboard");
    } catch (error) {
      console.error("Verification error:", error);
      toast("Invalid OTP. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Brand Watermark */}
      <div className="absolute top-8 left-8 flex items-center gap-2">
         <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-xl">
            P
          </div>
          <span className="font-bold text-xl text-secondary">ParkPing</span>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <Card className="shadow-2xl border-0 overflow-hidden">
          {/* Top colored accent line */}
          <div className="h-2 bg-gradient-to-r from-primary to-orange-400 w-full" />
          
          <CardContent className="px-8 pt-10 pb-12">
            <AnimatePresence mode="wait">
              {step === "phone" ? (
                <motion.div
                  key="phone-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-secondary tracking-tight">Login to ParkPing</h2>
                    <p className="mt-2 text-sm text-gray-500">Enter your mobile number to receive an OTP</p>
                  </div>

                  <form onSubmit={handleSendOTP} className="space-y-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number
                      </label>
                      <div className="relative rounded-xl shadow-sm border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none gap-2">
                          <span className="text-lg">🇮🇳</span>
                          <span className="text-gray-500 font-medium">+91</span>
                          <div className="h-5 w-px bg-gray-200 ml-1" />
                        </div>
                        <input
                          type="tel"
                          id="phone"
                          className="pl-[100px] block w-full outline-none py-4 bg-transparent text-lg font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                          placeholder="98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(formatPhone(e.target.value).replace("+91 ", ""))}
                          maxLength={11} // including spaces if formatted
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full text-lg h-14 bg-orange-500 hover:bg-orange-600 text-white" isLoading={loading}>
                      Send OTP
                    </Button>
                    
                    <p className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center gap-1">
                      New user? You&apos;ll be registered automatically
                    </p>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="otp-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <button 
                    onClick={() => setStep("phone")}
                    className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </button>

                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-secondary tracking-tight">Verify Device</h2>
                    <p className="mt-2 text-sm text-gray-500">
                      We&apos;ve sent a 6-digit code to <span className="font-semibold text-gray-900">+91 {phone}</span>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOTP} className="space-y-8">
                    <div className="px-2">
                      <OTPInput 
                        length={6} 
                        value={otp} 
                        onChange={setOtp} 
                        disabled={loading} 
                      />
                    </div>

                    <div className="space-y-4">
                      <Button type="submit" className="w-full text-lg h-14" isLoading={loading}>
                        Verify & Login
                      </Button>
                      <button 
                         type="button" 
                         className="w-full text-sm text-primary font-medium hover:text-primary-hover focus:outline-none"
                      >
                         Resend Code in 0:30
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Interactive Background Elements hidden behind card */}
      <div id="recaptcha-container" className="hidden"></div>
    </div>
  );
}
