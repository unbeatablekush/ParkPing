"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, CarFront, History, Settings, Menu, X, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_USER } from "@/lib/mock-data";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Vehicles", href: "/dashboard?tab=vehicles", icon: CarFront },
  { name: "Scan History", href: "/dashboard?tab=history", icon: History },
  { name: "Settings", href: "/dashboard?tab=settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
            // Note: Since we are using URL queries '?tab=xxx' for tabs in the same page for simplicity (as requested to make UI minimal),
            // this active check is rudimentary. In a fuller app, we might use next/router to check query params.
            return (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-gray-600 hover:bg-primary/5 hover:text-primary"
              >
                <item.icon className="w-5 h-5 opacity-70" />
                {item.name}
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl mb-4">
            <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
              {MOCK_USER.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold tracking-tight text-gray-900 truncate">
                {MOCK_USER.name}
              </p>
              <p className="text-xs text-gray-500 font-medium truncate">
                {MOCK_USER.phone}
              </p>
            </div>
          </div>
          
          <button className="flex w-full items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors">
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
