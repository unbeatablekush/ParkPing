"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast("Please fill in all fields.", "error");
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
           toast("Incorrect password or email. Please try again.", "error");
        } else {
           toast("No account found with this email, or incorrect credentials.", "error");
        }
        setLoading(false);
        return;
      }

      // Check if user has completed profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_completed')
        .eq('id', data.user.id)
        .single();
        
      if (!profile?.profile_completed) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
      
    } catch {
      toast("An unexpected error occurred.", "error");
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
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-secondary tracking-tight">Welcome Back</h2>
              <p className="mt-2 text-sm text-gray-500">Login to manage your vehicles</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                   <input
                     type={showPassword ? "text" : "password"}
                     required
                     className="block w-full rounded-xl border border-gray-200 pl-4 pr-12 py-4 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                     placeholder="••••••••"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                   />
                   <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                   >
                     {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                   </button>
                </div>
                <div className="flex justify-end mt-2">
                  <Link href="/auth/forgot-password" className="text-sm font-medium text-primary hover:text-primary-hover">
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <Button type="submit" className="w-full text-lg h-14 bg-orange-500 hover:bg-orange-600 text-white" isLoading={loading}>
                Login
              </Button>
              
              <div className="relative my-6">
                 <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                 </div>
                 <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                 </div>
              </div>

              <p className="text-center text-sm text-gray-500">
                <Link href="/auth/signup" className="font-semibold text-primary hover:text-primary-hover">
                  New user? Sign Up →
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
