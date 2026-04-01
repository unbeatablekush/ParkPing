"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { OTPInput } from "@/components/ui/OTPInput";
import { formatPhone } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastProvider";
import { supabaseClient } from "@/lib/supabase-client";

export default function AuthPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast("Please enter a valid email address", "error");
      return;
    }
    if (phone.length > 0 && phone.length < 10) {
      toast("Please enter a valid 10-digit number", "error");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email: email,
      });

      if (error) throw error;
      
      setStep("otp");
      toast("OTP sent to your email!", "success");
    } catch (error) {
      console.error("Supabase Email error:", error);
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
      const { error } = await supabaseClient.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;
      
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone })
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
                    <p className="mt-2 text-sm text-gray-500">Enter your email and mobile number to receive an OTP</p>
                  </div>

                  <form onSubmit={handleSendOTP} className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        className="block w-full rounded-xl border border-gray-200 px-4 py-4 text-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-400"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number (For Alerts)
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
                          placeholder="98765 43210 (Optional)"
                          value={phone}
                          onChange={(e) => setPhone(formatPhone(e.target.value).replace("+91 ", ""))}
                          maxLength={11}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full text-lg h-14 bg-orange-500 hover:bg-orange-600 text-white" isLoading={loading}>
                      Send OTP via Email
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
                    type="button"
                    className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </button>

                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-secondary tracking-tight">Verify Email</h2>
                    <p className="mt-2 text-sm text-gray-500">
                      We&apos;ve sent a securely generated 6-digit code to <span className="font-semibold text-gray-900">{email}</span>
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
                         onClick={handleSendOTP}
                         disabled={loading}
                         className="w-full text-sm text-primary font-medium hover:text-primary-hover focus:outline-none disabled:opacity-50"
                      >
                         Resend Code
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
