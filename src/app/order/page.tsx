"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CreditCard, Truck, ShieldCheck, Mail, MapPin } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { createClient } from "@/lib/supabase/client";

export default function OrderPage() {
  const toast = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    pincode: "",
  });

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address || !form.pincode) {
      return toast("Please complete your delivery details.", "error");
    }
    if (form.pincode.length !== 6) {
      return toast("Please enter a valid 6-digit PIN code.", "error");
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast("Please log in to place an order.", "error");
      setLoading(false);
      router.push("/auth/login");
      return;
    }

    const { error } = await supabase.from('orders').insert({
      user_id: session.user.id,
      full_name: form.name,
      phone: form.phone,
      address: form.address,
      pincode: form.pincode,
      amount: 198,
      payment_status: 'pending',
    });

    setLoading(false);

    if (error) {
      toast("Failed to place order: " + error.message, "error");
    } else {
      toast("Order placed successfully! 🎉", "success");
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-extrabold text-secondary tracking-tight mb-4">Complete your Order</h1>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">Your custom ParkPing QR stickers are just one step away.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-7">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                   <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                     <MapPin className="text-primary w-5 h-5" /> Delivery Address
                   </h3>
                   
                   <form onSubmit={handlePayment} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                          <input type="text" required className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                          <input type="tel" required className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} maxLength={10} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
                          <textarea required className="w-full py-3 px-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white min-h-[100px]" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">PIN Code</label>
                          <input type="text" required className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white" value={form.pincode} onChange={e=>setForm({...form,pincode:e.target.value.replace(/\D/g,'')})} maxLength={6} />
                        </div>
                     </div>

                     <div className="pt-6 border-t border-gray-100 mt-6 mt-8">
                        <Button type="submit" className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 shadow-lg text-white font-bold tracking-wide" isLoading={loading}>
                          <CreditCard className="mr-2" /> Pay securely via Razorpay
                        </Button>
                        <div className="text-center mt-4 text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                           <ShieldCheck className="w-4 h-4" /> 100% Secure Checkout
                        </div>
                     </div>
                   </form>
                </CardContent>
              </Card>
            </div>

            {/* Summary Column */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-2 border-primary bg-primary/[0.02]">
                <CardContent className="p-8">
                   <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-4">Order Summary</h3>
                   
                   <div className="space-y-4 mb-6 text-sm text-gray-600 font-medium">
                     <div className="flex justify-between">
                       <span>2x Custom QR Stickers</span>
                       <span className="text-gray-900">₹149</span>
                     </div>
                     <div className="flex justify-between text-success font-bold">
                       <span>3 Months Subscription</span>
                       <span>FREE</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Standard Delivery</span>
                       <span className="text-gray-900">₹49</span>
                     </div>
                   </div>

                   <div className="flex justify-between text-xl font-black text-secondary border-t border-gray-200 pt-4 mb-8">
                      <span>Total</span>
                      <span>₹198</span>
                   </div>

                   <div className="space-y-4">
                     <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <Truck className="w-8 h-8 text-primary p-1.5 bg-primary/10 rounded-md" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">Ships in 48 hrs</p>
                           <p className="text-xs text-gray-500 font-medium">Delivery usually takes 5-7 days</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <Mail className="w-8 h-8 text-secondary p-1.5 bg-secondary/10 rounded-md" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">Tracking via SMS</p>
                           <p className="text-xs text-gray-500 font-medium">Updates sent to your mobile</p>
                        </div>
                     </div>
                   </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
