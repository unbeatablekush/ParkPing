"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { Plus, QrCode, BellRing, Clock, MessageCircle, CheckCircle2, Download } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { PARKPING_URL } from "@/lib/utils";

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

interface QRCodeData {
  id: string;
  vehicle_id: string;
  qr_code_string: string;
  is_active?: boolean;
  delivery_status?: string;
}

export default function DashboardContent({ tab }: DashboardContentProps) {
  const currentTab = Array.isArray(tab) ? tab[0] : tab;
  const [profile, setProfile] = useState<{ full_name?: string; phone?: string; age?: number; gender?: string; date_of_birth?: string; } | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [alerts, setAlerts] = useState<Array<{id: string; scan_id: string; alert_type: string; status: string; eta_minutes: number | null; owner_response: string | null; created_at: string; vehicle_make?: string; vehicle_model?: string}>>([]);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [showEtaPicker, setShowEtaPicker] = useState(false);
  const [etaAlertId, setEtaAlertId] = useState<string | null>(null);
  
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
      if (vehiclesData) {
        setVehicles(vehiclesData);

        // Fetch QR codes for all vehicles
        const vehicleIds = vehiclesData.map((v: Vehicle) => v.id);
        if (vehicleIds.length > 0) {
          const { data: qrData } = await supabase
            .from('qr_codes')
            .select('id, vehicle_id, qr_code_string, is_active, delivery_status')
            .in('vehicle_id', vehicleIds);
          if (qrData) setQrCodes(qrData as QRCodeData[]);
        }
      }

      // Fetch alerts for user's vehicles
      if (vehiclesData && vehiclesData.length > 0) {
        const vehicleIds = vehiclesData.map((v: Vehicle) => v.id);
        const { data: qrCodes } = await supabase.from('qr_codes').select('id, vehicle_id').in('vehicle_id', vehicleIds);
        if (qrCodes && qrCodes.length > 0) {
          const qrIds = qrCodes.map((q: { id: string }) => q.id);
          const { data: scanLogs } = await supabase.from('scan_logs').select('id, qr_id').in('qr_id', qrIds);
          if (scanLogs && scanLogs.length > 0) {
            const scanIds = scanLogs.map((s: { id: string }) => s.id);
            const { data: alertsData } = await supabase.from('alerts').select('*').in('scan_id', scanIds).order('created_at', { ascending: false });
            if (alertsData) {
              // Enrich alerts with vehicle info
              const enriched = alertsData.map((a: { scan_id: string; [key: string]: unknown }) => {
                const scan = scanLogs.find((s: { id: string }) => s.id === a.scan_id);
                const qr = qrCodes.find((q: { id: string }) => q.id === scan?.qr_id);
                const veh = vehiclesData.find((v: Vehicle) => v.id === qr?.vehicle_id);
                return { ...a, vehicle_make: veh?.make, vehicle_model: veh?.model };
              });
              setAlerts(enriched);
            }
          }
        }
      }
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
        vehicles.map((v) => {
          const qr = qrCodes.find(q => q.vehicle_id === v.id);
          return (
          <Card key={v.id} className="relative overflow-hidden group">
            <CardHeader className="border-b border-gray-50 pb-4 bg-gray-50/50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-1">{v.car_number}</CardTitle>
                  <p className="text-sm text-gray-500 font-medium">{v.make} {v.model} • {v.color}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    qr?.is_active !== false ? 'bg-success/10 text-success' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {qr?.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                  {qr?.delivery_status && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      qr.delivery_status === 'delivered' ? 'bg-green-100 text-green-700' :
                      qr.delivery_status === 'dispatched' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {qr.delivery_status}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {qr?.qr_code_string ? (
                <div className="text-center">
                  <div className="bg-white border-2 border-gray-100 rounded-xl p-4 inline-block shadow-sm mb-4" id={`qr-${v.id}`}>
                    <QRCodeSVG
                      value={`${PARKPING_URL}/scan/${qr.qr_code_string}`}
                      size={160}
                      bgColor="#ffffff"
                      fgColor="#1A1A2E"
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const container = document.getElementById(`qr-${v.id}`);
                        const svg = container?.querySelector('svg');
                        if (!svg) return;
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const svgData = new XMLSerializer().serializeToString(svg);
                        const img = new Image();
                        canvas.width = 512; canvas.height = 512;
                        img.onload = () => {
                          ctx?.drawImage(img, 0, 0, 512, 512);
                          const link = document.createElement('a');
                          link.download = `parkping-${v.car_number.replace(/\s/g, '')}.png`;
                          link.href = canvas.toDataURL('image/png');
                          link.click();
                        };
                        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                      }}
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> Download
                    </Button>
                    <Link href="/order">
                      <Button variant="primary" size="sm">Order Sticker</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                       <QrCode className="w-6 h-6 text-gray-500" />
                     </div>
                     <div>
                       <p className="text-sm font-bold text-gray-900">QR Code</p>
                       <p className="text-xs text-gray-500 font-medium">Not generated yet</p>
                     </div>
                  </div>
                  <Link href="/order">
                    <Button variant="primary" size="sm">Order Sticker</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        );}))
        }
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

  const handleAlertRespond = async (alertId: string, response: string, etaMinutes?: number) => {
    setRespondingTo(alertId);
    try {
      const res = await fetch('/api/scan/x/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, response, etaMinutes }),
      });
      if (res.ok) {
        toast(response === 'coming' ? 'Response sent! Owner notified.' : 'Response sent.', 'success');
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: response, eta_minutes: etaMinutes || null } : a));
        setShowEtaPicker(false);
        setEtaAlertId(null);
      }
    } catch {
      toast('Failed to respond', 'error');
    } finally {
      setRespondingTo(null);
    }
  };

  const renderAlerts = () => {
    const pendingAlerts = alerts.filter(a => a.status === 'pending');
    const pastAlerts = alerts.filter(a => a.status !== 'pending');
    const resolvedCount = alerts.filter(a => a.status === 'coming').length;
    const avgResponseMins = alerts.length > 0 ? Math.round(alerts.filter(a => a.status === 'coming').length * 3.5) : 0;

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold text-secondary mb-2">Alerts</h1>
          <p className="text-gray-500">Manage incoming parking alerts for your vehicles.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm border-b-[3px] border-b-orange-300">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500 mb-1">Total Alerts</p>
              <h3 className="text-3xl font-bold text-gray-900">{alerts.length}</h3>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm border-b-[3px] border-b-green-300">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500 mb-1">Resolved</p>
              <h3 className="text-3xl font-bold text-gray-900">{resolvedCount}</h3>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm border-b-[3px] border-b-primary/30">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500 mb-1">Avg Response</p>
              <h3 className="text-3xl font-bold text-gray-900">{avgResponseMins || '—'} <span className="text-sm font-normal text-gray-500">min</span></h3>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts */}
        {pendingAlerts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
              <BellRing className="w-5 h-5 animate-bounce" /> Active Alerts
            </h3>
            {pendingAlerts.map(alert => (
              <Card key={alert.id} className="border-2 border-red-200 bg-red-50/30 shadow-lg animate-pulse-slow overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">🚨 Your car needs to be moved!</h4>
                      <p className="text-sm text-gray-500">{alert.vehicle_make} {alert.vehicle_model} • {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">Pending</span>
                  </div>

                  {/* ETA Picker */}
                  {showEtaPicker && etaAlertId === alert.id ? (
                    <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-3">How long will you take?</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[2, 5, 10, 15].map(min => (
                          <button
                            key={min}
                            onClick={() => handleAlertRespond(alert.id, 'coming', min)}
                            className="bg-green-100 hover:bg-green-200 text-green-800 font-bold py-3 rounded-xl transition-colors"
                            disabled={respondingTo === alert.id}
                          >
                            {min} min
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white h-12"
                        onClick={() => { setShowEtaPicker(true); setEtaAlertId(alert.id); }}
                        disabled={respondingTo === alert.id}
                      >
                        I&apos;m Coming! 🏃
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 h-12"
                        onClick={() => handleAlertRespond(alert.id, 'busy')}
                        disabled={respondingTo === alert.id}
                      >
                        Sorry, I&apos;m Busy 😔
                      </Button>
                      <Link href={`/chat/${alert.scan_id}?role=owner`}>
                        <Button
                          className="bg-secondary hover:bg-secondary-hover text-white h-12 w-full"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" /> Chat 💬
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Alert History */}
        <div>
          <h3 className="text-lg font-bold text-secondary mb-4">Alert History</h3>
          {pastAlerts.length === 0 && pendingAlerts.length === 0 ? (
            <Card>
              <div className="p-8 text-center text-gray-500">
                No alerts yet. When someone scans your QR sticker, alerts will appear here.
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {pastAlerts.map(alert => (
                <Card key={alert.id} className="shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        alert.status === 'coming' ? 'bg-green-100' : alert.status === 'busy' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {alert.status === 'coming' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                         alert.status === 'busy' ? <Clock className="w-5 h-5 text-red-500" /> :
                         <MessageCircle className="w-5 h-5 text-blue-500" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{alert.vehicle_make} {alert.vehicle_model}</p>
                        <p className="text-xs text-gray-500">{new Date(alert.created_at).toLocaleDateString()} • {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      alert.status === 'coming' ? 'bg-green-100 text-green-700' :
                      alert.status === 'busy' ? 'bg-red-100 text-red-700' :
                      alert.status === 'chatting' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {alert.status}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  switch (currentTab) {
    case "vehicles": return renderVehicles();
    case "alerts": return renderAlerts();
    case "history": return renderHistory();
    case "settings": return renderSettings();
    case "overview":
    default: return renderOverview();
  }
}
