"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

export default function ContactPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      return toast("Please fill in all fields before sending.", "error");
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast("Message sent successfully! We'll be in touch.", "success");
      setForm({ name: "", email: "", message: "" }); // Reset form
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-secondary tracking-tight mb-4">Get in touch</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Have a question, feedback, or need support? Drop us a message or reach out directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-start">
          
          {/* Contact Information Column */}
          <div className="space-y-8">
            <Card className="border-0 shadow-lg bg-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px]" />
              <CardContent className="p-8 relative z-10">
                <h3 className="text-2xl font-bold text-secondary mb-8">Contact Information</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold tracking-wider text-gray-500 uppercase mb-1">Email</p>
                      <a href="mailto:support@parkping.com" className="text-lg font-bold text-gray-900 hover:text-primary transition-colors">
                        support@parkping.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold tracking-wider text-gray-500 uppercase mb-1">Phone</p>
                      <a href="tel:+919430244054" className="text-lg font-bold text-gray-900 hover:text-primary transition-colors">
                        +91 9430244054
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold tracking-wider text-gray-500 uppercase mb-1">Office Location</p>
                      <p className="text-lg font-bold text-gray-900 leading-snug">
                        D2, VIT Chennai<br/>
                        Kelambakkam - Vandalur Road<br/>
                        Chennai - 600127
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social Connect */}
                <div className="mt-12 pt-8 border-t border-gray-100">
                   <p className="text-sm font-semibold tracking-wider text-gray-500 uppercase mb-4">Follow us on Social</p>
                   <div className="flex gap-4">
                     {/* Instagram standard SVG icon */}
                     <a href="#" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-[#E1306C] hover:text-white transition-colors duration-300 shadow-sm hover:shadow-md">
                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                     </a>
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form Column */}
          <Card className="border-0 shadow-lg bg-white h-full">
            <CardContent className="p-8 lg:p-10 h-full flex flex-col">
              <h3 className="text-2xl font-bold text-secondary mb-6">Send a Message</h3>
              <form onSubmit={handleSubmit} className="space-y-6 flex-grow flex flex-col">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                    placeholder="Rahul Sharma"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                    placeholder="rahul@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="flex-grow">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
                  <textarea
                    id="message"
                    required
                    className="w-full py-4 px-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white h-40 resize-none"
                    placeholder="How can we help you today?"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full h-14 text-lg mt-auto" isLoading={loading}>
                  <Send className="w-5 h-5 mr-2" /> Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </main>
      <Footer />
    </div>
  );
}
