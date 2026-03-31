"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full prose prose-lg prose-indigo">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <p className="text-gray-500 mb-8">Effective Date: October 2025</p>
        
        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          By accessing or using ParkPing, you agree to comply with and be bound by these Terms. If you disagree, you may not use our service to register your vehicle or scan existing stickers.
        </p>

        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">2. Appropriate Use and Conduct</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          The service is meant solely for the purpose of communicating with vehicle owners causing obstructions. Spamming, harassing, or using the communication channel for advertisement or malicious intent will result in immediate permanent suspension and reporting to local authorities.
        </p>

        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">3. Subscriptions and Payments</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Physical stickers are non-refundable once dispatched. The subscription fee grants you continued access to backend communication systems. ParkPing reserves the right to terminate accounts with unverified or fraudulent vehicles mapped.
        </p>

        <p className="text-gray-600 mt-12 pt-8 border-t border-gray-100 italic">
          If you run into any issues, you can email us at support@parkping.in.
        </p>
      </main>
      <Footer />
    </div>
  );
}
