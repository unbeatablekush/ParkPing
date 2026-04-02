"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [userName, setUserName] = useState("");

  const checkAuth = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuth(!!session);
    if (session) {
      const { data } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
      if (data?.full_name) setUserName(data.full_name.split(' ')[0]);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      setIsAuth(!!session);
      if (session) {
        const { data } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
        if (data?.full_name) setUserName(data.full_name.split(' ')[0]);
      } else {
        setUserName("");
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAuth]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "How it Works", href: "/#how-it-works" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Contact", href: "/contact" }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-2xl shadow-md group-hover:scale-105 transition-transform duration-300">
              P
            </div>
            <span className="font-bold text-2xl tracking-tight text-foreground">ParkPing</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className="text-gray-600 hover:text-primary font-medium transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <Link href="/order">
              <Button variant="primary">Get Your QR Sticker</Button>
            </Link>
            <Link href={isAuth ? "/dashboard" : "/auth/login"}>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                {isAuth ? (userName || "Dashboard") : "Login / Sign Up"}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-md"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-b border-gray-200 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-2 px-3">
                <Link href="/order" onClick={() => setIsOpen(false)} className="mb-3 block">
                  <Button variant="primary" className="w-full">Get Your QR Sticker</Button>
                </Link>
                <Link href={isAuth ? "/dashboard" : "/auth/login"} onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                    {isAuth ? (userName || "Dashboard") : "Login / Sign Up"}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
