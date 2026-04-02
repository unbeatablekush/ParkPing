"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { OTPInput } from "@/components/ui/OTPInput";
import { formatPhone } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastProvider";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";

export default function SignupPage() {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast("Please enter a valid email.", "error");
      return;
    }
    if (phone.length !== 10) {
      toast("Please enter a valid 10-digit number.", "error");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true
        }
      });

      if (error) throw error;
      
      setStep("otp");
      toast("OTP sent to your email!", "success");
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : "Failed to send OTP.", "error");
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
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;
      
      // Check if they are a returning user who already completed the profile
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
         const { data: profile } = await supabase.from('profiles').select('profile_completed').eq('id', session.user.id).single();
         if (profile?.profile_completed) {
            toast("Successfully logged in!", "success");
            router.push("/dashboard");
            return;
         }
      }

      localStorage.setItem("temp_phone", phone);
      toast("Successfully verified!", "success");
      router.push("/onboarding");
      
    } catch {
      toast("Invalid OTP. Please try again.", "error");
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

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 animate-in fade-in zoom-in-95 duration-500">
        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary to-orange-400 w-full" />
          <CardContent className="px-8 pt-10 pb-12">
            {step === "details" ? (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-secondary tracking-tight">Create Your Account</h2>
                  <p className="mt-2 text-sm text-gray-500">Join ParkPing and say goodbye to blocked cars</p>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      className="block w-full rounded-xl border border-gray-200 px-4 py-4 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <div className="relative rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none gap-2">
                        <span className="text-lg">🇮🇳</span>
                        <span className="text-gray-500 font-medium">+91</span>
                        <div className="h-5 w-px bg-gray-200 ml-1" />
                      </div>
                      <input
                        type="tel"
                        required
                        className="pl-[100px] block w-full outline-none py-4 bg-transparent font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value).replace("+91 ", ""))}
                        maxLength={11}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full text-lg h-14 bg-orange-500 hover:bg-orange-600 text-white" isLoading={loading}>
                    Send Verification OTP
                  </Button>
                  
                  <p className="text-center text-sm text-gray-500 mt-6">
                    <Link href="/auth/login" className="font-semibold text-primary hover:text-primary-hover">
                      Already have an account? Login →
                    </Link>
                  </p>
                </form>
              </>
            ) : (
              <>
                 <button 
                    onClick={() => setStep("details")}
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
                    <Button type="submit" className="w-full text-lg h-14 bg-primary text-white" isLoading={loading}>
                      Verify & Continue
                    </Button>
                  </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
