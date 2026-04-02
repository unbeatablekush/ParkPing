"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { Plus, QrCode } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface DashboardContentProps {
  tab: string | string[];
}

interface Vehicle {
  id: string;
  car_number: string;
  make: string;
  model: string;
  color?: string;
  qr_id?: string;
}

export default function DashboardContent({ tab }: DashboardContentProps) {
  const currentTab = Array.isArray(tab) ? tab[0] : tab;
  const [profile, setProfile] = useState<{ full_name?: string; phone?: string; age?: number; gender?: string; date_of_birth?: string; } | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  // Settings Form State
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setEmail(session.user.email || "");
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setAge(data.age?.toString() || "");
        setGender(data.gender || "");
        setDob(data.date_of_birth || "");
        setPhone(data.phone || "");
      }

      const { data: vehiclesData } = await supabase.from('vehicles').select('*').eq('user_id', session.user.id);
      if (vehiclesData) setVehicles(vehiclesData);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast("Session expired. Please log in again.", "error");
      setLoading(false);
      return;
    }
     
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      full_name: fullName,
      age: parseInt(age) || null,
      gender: gender || null,
      date_of_birth: dob || null,
      phone: phone || null,
      email: session.user.email,
      profile_completed: true,
    }, { onConflict: 'id' });
     
    if (error) {
      toast("Failed to update profile: " + error.message, "error");
    } else {
      toast("Profile updated successfully!", "success");
      // Re-fetch to update progress bar and sidebar
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) {
        setProfile(data);
      }
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      toast(error.message, "error");
    } else {
      toast("Check your email for the password reset link", "success");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This action is irreversible and will void all your QR stickers.");
    if (!confirmed) return;
    
    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast("Session expired.", "error");
      setLoading(false);
      return;
    }

    // Delete vehicles and profile (cascade should handle profile via auth.users FK)
    await supabase.from('vehicles').delete().eq('user_id', session.user.id);
    await supabase.from('profiles').delete().eq('id', session.user.id);
    
    // Sign out
    await supabase.auth.signOut({ scope: 'local' });
    localStorage.clear();
    sessionStorage.clear();
    toast("Account data deleted. Redirecting...", "success");
    setTimeout(() => { window.location.replace('/auth/login'); }, 1000);
  };

  const calcCompletion = () => {
    if (!profile) return 0;
    let count = 0;
    if (profile.full_name) count++;
    if (profile.age) count++;
    if (profile.gender) count++;
    if (profile.date_of_birth) count++;
    if (profile.phone) count++;
    return (count / 5) * 100;
  };

  const completionPercent = calcCompletion();

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-secondary mb-2">Hello, {profile?.full_name?.split(' ')[0] || "there"} 👋</h1>
        <p className="text-gray-500">Here&apos;s what is happening with your registered vehicles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Scans", value: 0 },
          { label: "Calls Received", value: 0 },
          { label: "Alerts Received", value: 0 },
          { label: "Cars Registered", value: vehicles.length },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm border-b-[3px] border-b-primary/20">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h3 className="text-xl font-bold text-secondary mb-4">Recent Scan Activity</h3>
        <Card>
          <div className="divide-y divide-gray-100 p-8 text-center text-gray-500">
             No recent scans to display. Your car is safe!
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl text-center">
            <Link href="/dashboard?tab=history" className="text-primary hover:text-primary-hover font-semibold text-sm">
              View All History →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderVehicles = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary mb-2">My Vehicles</h1>
          <p className="text-gray-500">Manage your cars and their associated ParkPing QR codes.</p>
        </div>
        <Link href="/register">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" /> Add Vehicle
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vehicles.length === 0 ? (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
             <p className="text-gray-500 mb-4">No vehicles registered yet.</p>
             <Link href="/register">
               <Button variant="primary">Register Your First Car</Button>
             </Link>
          </div>
        ) : (
        vehicles.map((v) => (
          <Card key={v.id} className="relative overflow-hidden group">
            <CardHeader className="border-b border-gray-50 pb-4 bg-gray-50/50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-1">{v.car_number}</CardTitle>
                  <p className="text-sm text-gray-500 font-medium">{v.make} {v.model} • {v.color}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-success/10 text-success">
                  Registered
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                       <QrCode className="w-6 h-6 text-gray-500" />
                     </div>
                     <div>
                       <p className="text-sm font-bold text-gray-900">QR Sticker Config</p>
                       <p className="text-xs text-gray-500 font-medium font-mono">{v.qr_id || "Awaiting mapping"}</p>
                     </div>
                  </div>
                  <Link href="/order">
                    <Button variant="primary" size="sm">Order Sticker</Button>
                  </Link>
               </div>
            </CardContent>
          </Card>
        )))}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary mb-2">Scan History</h1>
        <p className="text-gray-500">Complete log of every time your vehicles were scanned.</p>
      </div>
      
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 font-semibold text-gray-600 text-sm w-1/4">Date & Time</th>
                <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Vehicle</th>
                <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Method</th>
                <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Location</th>
                <th className="py-4 px-6 font-semibold text-gray-600 text-sm w-1/6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               <tr>
                 <td colSpan={5} className="py-8 text-center text-gray-500">
                    No scan history available for your vehicles.
                 </td>
               </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6 max-w-2xl animate-in fade-in duration-500">
      <div className="mb-6 flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-bold text-secondary mb-2">Account Settings</h1>
           <p className="text-gray-500">Manage your profile details and preferences.</p>
        </div>
      </div>
      
      {/* Profile Completion Bar */}
      <div className="mb-6">
          <div className="flex justify-between items-end mb-2 text-sm font-medium text-gray-500">
             <span>Profile Completion</span>
             <span className="text-primary font-bold">{Math.round(completionPercent)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
             <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${completionPercent}%` }}></div>
          </div>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-100 pb-4 mb-4">
          <CardTitle>Profile Details</CardTitle>
          <p className="text-sm text-gray-500">Update your personal information.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-5">
             <div className="grid grid-cols-2 gap-4">
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                     <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                     <input required type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
                 </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                     <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                     <select value={gender} onChange={e => setGender(e.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white">
                         <option value="">Select</option>
                         <option value="Male">Male</option>
                         <option value="Female">Female</option>
                         <option value="Other">Other</option>
                         <option value="Prefer not to say">Prefer not to say</option>
                     </select>
                 </div>
             </div>
             
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
             </div>
             
             <div className="pt-2">
                 <Button type="submit" isLoading={loading}>Save Changes</Button>
             </div>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="border-b border-gray-100 pb-4 mb-4">
           <CardTitle>Authentication</CardTitle>
           <p className="text-sm text-gray-500">Manage your password.</p>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-gray-600 mb-4">Click below to receive a secure password reset link to your email address ({email}).</p>
           <Button variant="outline" onClick={handleResetPassword} disabled={loading || !email}>Change Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
           <CardTitle className="text-red-500">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-gray-500 mb-4">Deleting your account will void your active QR stickers instantly.</p>
           <Button variant="danger" onClick={handleDeleteAccount} isLoading={loading}>Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );

  switch (currentTab) {
    case "vehicles": return renderVehicles();
    case "history": return renderHistory();
    case "settings": return renderSettings();
    case "overview":
    default: return renderOverview();
  }
}
