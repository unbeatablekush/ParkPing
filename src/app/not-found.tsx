"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4 text-center">
        <div className="w-24 h-24 mb-6 rounded-3xl bg-primary/10 flex items-center justify-center">
          <span className="text-4xl font-extrabold text-primary">404</span>
        </div>
        <h2 className="text-3xl font-extrabold text-secondary mb-4 tracking-tight">Oops! Wrong Turn.</h2>
        <p className="text-gray-500 max-w-md mb-8">
          The page or QR code you are looking for does not exist or has been deactivated.
        </p>
        <Link href="/">
          <Button variant="primary" className="h-12 px-8 shadow-md">
            Return Home
          </Button>
        </Link>
      </main>
    </div>
  );
}
