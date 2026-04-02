"use client";

import { useState, useEffect } from "react";
import { MOCK_STATS, MOCK_VEHICLES, MOCK_SCAN_HISTORY } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { MapPin, Phone, BellRing, Plus, QrCode } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface DashboardContentProps {
  tab: string | string[];
}

export default function DashboardContent({ tab }: DashboardContentProps) {
  const currentTab = Array.isArray(tab) ? tab[0] : tab;
  const [profile, setProfile] = useState<{ full_name?: string; phone?: string; age?: number; gender?: string; date_of_birth?: string; } | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const supabase = createClient();
  
  // Settings Form State
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
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
      }
    });
  }, [supabase]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
     const { data: { session } } = await supabase.auth.getSession();
     if (!session) return;
     
     const { error } = await supabase.from('profiles').update({
        full_name: fullName,
        age: parseInt(age) || null,
        gender,
        date_of_birth: dob,
        phone
     }).eq('id', session.user.id);
     
     setLoading(false);
     if (error) {
        toast("Failed to update profile", "error");
     } else {
        toast("Profile updated successfully", "success");
        // re-fetch to update progress bar dynamically
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (data) setProfile(data);
     }
  };

  const handleResetPassword = async () => {
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
        toast(error.message, "error");
    } else {
        toast("Check your email for the password reset link", "success");
    }
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
          { label: "Total Scans", value: MOCK_STATS.totalScans },
          { label: "Calls Received", value: MOCK_STATS.callsReceived },
          { label: "Alerts Received", value: MOCK_STATS.alertsReceived },
          { label: "Cars Registered", value: MOCK_STATS.carsRegistered },
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
          <div className="divide-y divide-gray-100">
             {/* Use existing mock data just to preserve visual structure until APIs are added later */}
            {MOCK_SCAN_HISTORY.slice(0, 3).map((scan) => (
              <div key={scan.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0",
                    scan.method === "call" ? "bg-primary" : "bg-secondary"
                  )}>
                    {scan.method === "call" ? <Phone className="w-4 h-4" /> : <BellRing className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{scan.car}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {scan.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                     {new Date(scan.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mt-1",
                    scan.status === "resolved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {scan.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
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
        {MOCK_VEHICLES.map((v) => (
          <Card key={v.id} className="relative overflow-hidden group">
            <CardHeader className="border-b border-gray-50 pb-4 bg-gray-50/50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-1">{v.car_number}</CardTitle>
                  <p className="text-sm text-gray-500 font-medium">{v.make} {v.model} • {v.color}</p>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                  v.status === "Active" ? "bg-success/10 text-success" : "bg-orange-100 text-orange-700"
                )}>
                  {v.status}
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
                  {v.status === "Active" ? (
                      <Button variant="outline" size="sm">Manage</Button>
                  ) : (
                      <Link href="/order">
                        <Button variant="primary" size="sm">Order Sticker</Button>
                      </Link>
                  )}
               </div>
            </CardContent>
          </Card>
        ))}
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
              {MOCK_SCAN_HISTORY.map((scan) => (
                <tr key={scan.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900 text-sm">
                     {new Date(scan.date).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-4 px-6 text-gray-600 font-semibold">{scan.car}</td>
                  <td className="py-4 px-6">
                    <span className="flex items-center gap-1.5 text-sm font-medium capitalize text-gray-700">
                      {scan.method === "call" ? <Phone className="w-3.5 h-3.5 text-primary"/> : <BellRing className="w-3.5 h-3.5 text-secondary"/>}
                      {scan.method}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600 text-sm">{scan.location}</td>
                  <td className="py-4 px-6">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mt-1",
                      scan.status === "resolved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {scan.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
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
           <Button variant="danger">Delete Account</Button>
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
