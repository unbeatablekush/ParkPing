"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutDashboard, CarFront, History, Settings, Menu, X, LogOut, BellRing, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useFCMToken } from "@/hooks/useFCMToken";
import { messaging, onMessage } from "@/lib/firebase";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Vehicles", href: "/dashboard?tab=vehicles", icon: CarFront },
  { name: "Alerts", href: "/dashboard?tab=alerts", icon: BellRing },
  { name: "Messages", href: "/dashboard?tab=messages", icon: MessageCircle },
  { name: "Scan History", href: "/dashboard?tab=history", icon: History },
  { name: "Settings", href: "/dashboard?tab=settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<{ full_name?: string; phone?: string; email?: string } | null>(null);
  const [hasAlertDot, setHasAlertDot] = useState(false);
  const [hasMessageDot, setHasMessageDot] = useState(false);

  // Initialize FCM on dashboard mount
  useFCMToken();

  // Listen for incoming FCM messages while app is open
  useEffect(() => {
    if (!messaging) return;
    const unsubscribe = onMessage(messaging, (payload) => {
      // Vibrate if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([500, 200, 500, 200, 1000]);
      }
      // Show browser notification as backup
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || '🚨 ParkPing Alert', {
          body: payload.notification?.body || 'Someone needs you to move your car!',
          icon: '/favicon.ico',
        });
      }
      // Navigate to alerts tab
      window.location.href = '/dashboard?tab=alerts';
    });
    return () => unsubscribe();
  }, []);

  const supabase = createClient();
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Helper component to handle search params logic within a Suspense boundary
  const DashboardSync = () => {
    const searchParams = useSearchParams();
    const currentTab = searchParams.get("tab") || "overview";

    useEffect(() => {
      const markAsRead = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: vehicles } = await supabase.from('vehicles').select('id').eq('user_id', session.user.id);
        if (!vehicles || vehicles.length === 0) return;
        const vehicleIds = vehicles.map((v: { id: string }) => v.id);
        const { data: qrCodes } = await supabase.from('qr_codes').select('id').in('vehicle_id', vehicleIds);
        if (!qrCodes || qrCodes.length === 0) return;
        const qrIds = qrCodes.map((q: { id: string }) => q.id);
        const { data: scanLogs } = await supabase.from('scan_logs').select('id').in('qr_id', qrIds);
        if (!scanLogs || scanLogs.length === 0) return;
        const scanIds = scanLogs.map((s: { id: string }) => s.id);

        if (currentTab === "alerts") {
          await supabase.from('alerts').update({ status: 'reviewed' }).in('scan_id', scanIds).eq('status', 'pending');
          fetchNotifications();
        } else if (currentTab === "messages") {
          await supabase.from('messages').update({ is_read: true }).in('scan_id', scanIds).eq('sender_type', 'scanner').eq('is_read', false);
          fetchNotifications();
        }
      };

      markAsRead();
    }, [currentTab]);

    return null;
  };

  const fetchProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setProfile({ full_name: session.user.user_metadata?.full_name || '', email: session.user.email || '', phone: '' });
      const { data } = await supabase.from('profiles').select('full_name, phone, email').eq('id', session.user.id).single();
      if (data) {
        setProfile(data);
      }
    }
  }, [supabase]);

  const fetchNotifications = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: vehicles } = await supabase.from('vehicles').select('id').eq('user_id', session.user.id);
    if (!vehicles || vehicles.length === 0) return;

    const vehicleIds = vehicles.map((v: { id: string }) => v.id);
    const { data: qrCodes } = await supabase.from('qr_codes').select('id').in('vehicle_id', vehicleIds);
    if (!qrCodes || qrCodes.length === 0) return;

    const qrIds = qrCodes.map((q: { id: string }) => q.id);
    const { data: scanLogs } = await supabase.from('scan_logs').select('id').in('qr_id', qrIds);
    if (!scanLogs || scanLogs.length === 0) return;

    const scanIds = scanLogs.map((s: { id: string }) => s.id);

    const [{ count: alertCount }, { count: messageCount }] = await Promise.all([
      supabase.from('alerts').select('id', { count: 'exact', head: true }).in('scan_id', scanIds).eq('status', 'pending'),
      supabase.from('messages').select('id', { count: 'exact', head: true }).in('scan_id', scanIds).eq('sender_type', 'scanner').eq('is_read', false),
    ]);

    setHasAlertDot((alertCount || 0) > 0);
    setHasMessageDot((messageCount || 0) > 0);
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const channel = supabase
        .channel('dashboard-notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchNotifications())
        .subscribe();

      subscriptionRef.current = channel;
    };

    setupSubscription();
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [fetchNotifications, supabase]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: 'local' });
    // Clear all storage to ensure no stale state
    localStorage.clear();
    sessionStorage.clear();
    // Force full page reload to login — bypasses any client-side caching
    window.location.replace('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Suspense fallback={null}>
        <DashboardSync />
      </Suspense>
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/80 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform lg:translate-x-0 lg:static lg:w-72 flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-20 flex items-center px-6 border-b border-gray-100 justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
              P
            </div>
            <span className="font-bold tracking-tight text-xl text-secondary">ParkPing</span>
          </Link>
          <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const showDot = item.name === 'Alerts' ? hasAlertDot : item.name === 'Messages' ? hasMessageDot : false;
            return (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-gray-600 hover:bg-primary/5 hover:text-primary"
              >
                <item.icon className="w-5 h-5 opacity-70" />
                <span>{item.name}</span>
                {showDot && <span className="ml-auto h-2.5 w-2.5 rounded-full bg-orange-500" />}
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          {/* Clicking the profile card takes user to settings where they can edit their profile */}
          <a href="/dashboard?tab=settings" className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl mb-4 hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold tracking-tight text-gray-900 truncate">
                {profile?.full_name?.split(' ')[0] || "User"}
              </p>
              <p className="text-xs text-gray-500 font-medium truncate">
                {profile?.phone || profile?.email || "Set up profile"}
              </p>
            </div>
          </a>
          
          <button 
            onClick={handleLogout} 
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 opacity-70" />
            Sign out
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
        <header className="h-20 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none p-2 -ml-2 rounded-md"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 flex justify-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-xl">
                P
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
