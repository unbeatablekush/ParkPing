"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full prose prose-lg prose-indigo">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last Updated: October 2025</p>
        
        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">1. Information We Collect</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          At ParkPing, we collect information you provide directly to us when you create an account, register a vehicle, or communicate with us. This includes your phone number, vehicle details, and order information. We intentionally do not collect or display your name to other users during the scanning process.
        </p>

        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">2. How We Use Information</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          The primary purpose of ParkPing is to connect vehicle owners with scanners securely. Your phone number is never shared directly. All communication is routed securely via a masked proxy. We also use your data to send QR stickers to your provided address.
        </p>

        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">3. Data Security</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          We use enterprise-grade encryption to protect your data. Push notifications are delivered via Firebase Cloud Messaging (FCM), and we ensure that we only log minimal metadata (such as timestamp and location) to discourage misuse of the platform.
        </p>
        
        <p className="text-gray-600 mt-12 pt-8 border-t border-gray-100 italic">
          For full legal inquiries, please contact legal@parkping.in.
        </p>
      </main>
      <Footer />
    </div>
  );
}
