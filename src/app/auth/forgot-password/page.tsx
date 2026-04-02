"use client";

import { useState } from "react";
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const toast = useToast();
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      toast(error.message, "error");
    } else {
      setSuccess(true);
    }
    setLoading(false);
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
            {success ? (
               <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                     <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h2 className="text-2xl font-bold text-secondary mb-2">Check your email</h2>
                  <p className="text-gray-500 mb-6">We have sent a password reset link to {email}</p>
                  <Link href="/auth/login">
                     <Button className="w-full" variant="outline">Return to login</Button>
                  </Link>
               </div>
            ) : (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-secondary tracking-tight">Reset your password</h2>
                    <p className="mt-2 text-sm text-gray-500">We will send you an email to reset your password.</p>
                  </div>

                  <form onSubmit={handleReset} className="space-y-6">
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
                    
                    <Button type="submit" className="w-full text-lg h-14 bg-orange-500 hover:bg-orange-600 text-white" isLoading={loading}>
                      Send Reset Link
                    </Button>
                    
                    <p className="text-center text-sm mt-6">
                      <Link href="/auth/login" className="font-semibold text-primary hover:text-primary-hover">
                        ← Back to login
                      </Link>
                    </p>
                  </form>
                </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
