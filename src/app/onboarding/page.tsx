"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { createClient } from "@/lib/supabase/client";
import { formatCarNumber } from "@/lib/utils";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);

  // Step 1 Data
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2 Data
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 3 Data
  const [carNumber, setCarNumber] = useState("");
  const [carMake, setCarMake] = useState("");
  const [carModel, setCarModel] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
         setUserId(session.user.id);
         const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
         if (data) {
             setFullName(data.full_name || "");
             setAge(data.age?.toString() || "");
             setGender(data.gender || "");
             setDob(data.date_of_birth || "");
             setPhone(data.phone || localStorage.getItem("temp_phone") || "");
         } else {
             setPhone(localStorage.getItem("temp_phone") || "");
         }
      }
    };
    fetchUser();
  }, [supabase.auth, supabase]);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !age || !gender || !dob || !phone) {
        toast("Please fill in all personal details.", "error"); return;
    }
    setLoading(true);
    
    // Save to profiles and users metadata using upsert in case trigger failed
    const { error } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: fullName,
        age: parseInt(age),
        gender,
        date_of_birth: dob,
        phone
    }, { onConflict: 'id' });
    
    // Also update auth.users
    await supabase.auth.updateUser({
        data: { full_name: fullName, age: parseInt(age), gender, date_of_birth: dob }
    });

    setLoading(false);
    if (error) toast(error.message, "error");
    else setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
       toast("Password does not meet requirements.", "error"); return;
    }
    if (password !== confirmPassword) {
        toast("Passwords do not match.", "error"); return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    
    if (error) toast(error.message, "error");
    else setStep(3);
  };

  const completeOnboarding = async () => {
      setLoading(true);
      await supabase.from('profiles').upsert({ id: userId, profile_completed: true }, { onConflict: 'id' });
      setLoading(false);
      setStep(4);
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Ideally we would add to vehicles table here
    await supabase.from('vehicles').insert({
        user_id: userId,
        car_number: carNumber,
        make: carMake,
        model: carModel,
    });
    setLoading(false);
    // Even if it fails (e.g. table not ready), move to Complete
    await completeOnboarding();
  };

  // Utilities
  const calculateStrength = () => {
     let c = 0;
     if (password.length >= 8) c++;
     if (/[A-Z]/.test(password)) c++;
     if (/[0-9]/.test(password)) c++;
     if (/[^a-zA-Z0-9]/.test(password)) c++;
     return c; // 0 to 4
  }
  const strength = calculateStrength();
  const strengthColors = ["bg-red-200", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10">
        
        {/* Progress Bar */}
        {step < 4 && (
            <div className="mb-8">
                <div className="flex justify-between items-end mb-2 text-sm font-medium text-gray-500">
                    <span>Step {step} of 3</span>
                    <span className="text-primary font-bold">{Math.round((step/3)*100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${(step/3)*100}%` }}></div>
                </div>
            </div>
        )}

        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary to-orange-400 w-full" />
          <CardContent className="px-8 pt-10 pb-12">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-secondary">Tell us about yourself</h2>
                  </div>
                  <form onSubmit={handleStep1} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                            <input required type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select required value={gender} onChange={e => setGender(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white">
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                            <input required type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
                        </div>
                    </div>
                    <Button type="submit" className="w-full mt-6 h-12" isLoading={loading}>Continue →</Button>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-secondary">Create a secure password</h2>
                    <p className="mt-2 text-sm text-gray-500">You&apos;ll use this to login next time instead of OTP</p>
                  </div>
                  <form onSubmit={handleStep2} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                            <input required type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400">
                                {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative">
                            <input required type={showPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
                        </div>
                    </div>
                    
                    {/* Strength visualizer */}
                    <div className="pt-2">
                        <div className="flex gap-1 h-1.5 mb-2">
                           {[1,2,3,4].map(i => (
                               <div key={i} className={`flex-1 rounded-full ${i <= strength ? strengthColors[strength] : 'bg-gray-200'}`} />
                           ))}
                        </div>
                        <ul className="text-xs text-gray-500 space-y-1">
                            <li className={password.length >= 8 ? "text-green-500" : ""}>✓ Minimum 8 characters</li>
                            <li className={/[A-Z]/.test(password) ? "text-green-500" : ""}>✓ At least one uppercase letter</li>
                            <li className={/[0-9]/.test(password) ? "text-green-500" : ""}>✓ At least one number</li>
                            <li className={/[^a-zA-Z0-9]/.test(password) ? "text-green-500" : ""}>✓ At least one special character</li>
                        </ul>
                    </div>

                    <Button type="submit" disabled={strength < 4 || password !== confirmPassword} className="w-full mt-6 h-12" isLoading={loading}>Create Password →</Button>
                  </form>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-secondary">Register your first vehicle</h2>
                    <p className="mt-2 text-sm text-gray-500">Add your car details to get your ParkPing QR sticker</p>
                  </div>
                  <form onSubmit={handleStep3} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Car Number</label>
                        <input required type="text" value={carNumber} onChange={e => setCarNumber(formatCarNumber(e.target.value))} placeholder="MH 01 AB 1234" maxLength={13} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary uppercase text-lg font-bold tracking-wider" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Car Make</label>
                            <select required value={carMake} onChange={e => setCarMake(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary bg-white">
                                <option value="">Select</option>
                                {["Maruti", "Hyundai", "Tata", "Honda", "Toyota", "Mahindra", "Kia", "MG", "Ford", "Other"].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Car Model</label>
                            <input required type="text" value={carModel} onChange={e => setCarModel(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload RC Book photo (optional)</label>
                        <input type="file" accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                    </div>

                    <Button type="submit" className="w-full mt-6 h-12" isLoading={loading}>Register Vehicle →</Button>
                    <div className="text-center mt-4">
                        <button type="button" onClick={() => completeOnboarding()} className="text-sm font-medium text-gray-500 hover:text-gray-900">Skip for now →</button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="text-center py-8">
                     <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                     >
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                     </motion.div>
                     <h2 className="text-3xl font-bold text-secondary mb-3">You&apos;re all set! 🎉</h2>
                     <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                        Your ParkPing account is ready. Your QR sticker will be delivered in 5-7 days after you complete your order.
                     </p>
                     <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white h-14 text-lg" onClick={() => router.push("/dashboard")}>
                        Go to Dashboard →
                     </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
