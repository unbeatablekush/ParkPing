"use client";

import { motion } from "framer-motion";
import { MOCK_STATS, MOCK_USER, MOCK_VEHICLES, MOCK_SCAN_HISTORY } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MapPin, Phone, BellRing, Settings, Plus, QrCode } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardContentProps {
  tab: string | string[];
}

export default function DashboardContent({ tab }: DashboardContentProps) {
  const currentTab = Array.isArray(tab) ? tab[0] : tab;

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-secondary mb-2">Hello, {MOCK_USER.name} 👋</h1>
        <p className="text-gray-500">Here's what is happening with your registered vehicles.</p>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary mb-2">Account Settings</h1>
        <p className="text-gray-500">Manage your notification preferences and profile details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <p className="text-sm text-gray-500">Control how you receive alerts from users.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { title: "Push Alerts", desc: "Receive native device notifications when scanned." },
            { title: "Call Forwarding", desc: "Allow masked calls through Twilio from scanners." },
            { title: "Do Not Disturb", desc: "Silence all alerts between 10PM and 6AM." }
          ].map((item, i) => (
             <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-4 last:pb-0 last:border-0">
               <div>
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
               </div>
               <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer shadow-inner">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm" />
               </div>
             </div>
          ))}
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
