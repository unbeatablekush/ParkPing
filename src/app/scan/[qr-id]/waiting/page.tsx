"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SonarPing } from "@/components/ui/SonarPing";
import { Button } from "@/components/ui/Button";
import { X, CheckCircle2, Phone } from "lucide-react";

export default function WaitingPage({ params }: { params: { "qr-id": string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<"waiting" | "coming" | "expired">("waiting");
  const [eta, setEta] = useState<number | null>(null);

  // Mocking real-time updates
  useEffect(() => {
    // Owner responds after 5 seconds
    const timer = setTimeout(() => {
      setStatus("coming");
      setEta(3); // 3 minutes ETA
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden min-h-[500px] flex flex-col relative">
        <button 
          onClick={() => router.back()}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 z-10 p-2"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center pt-8">
          
          {status === "waiting" && (
            <div className="animate-in fade-in duration-500 flex flex-col items-center">
              <h2 className="text-2xl font-bold text-secondary mb-2">Alert Sent!</h2>
              <p className="text-gray-500 font-medium max-w-xs">We've notified the owner via a high-priority push notification.</p>
              <SonarPing />
              <p className="text-sm font-semibold text-primary animate-pulse mt-4">Waiting for their response...</p>
            </div>
          )}

          {status === "coming" && (
            <div className="animate-in slide-in-from-bottom flex flex-col items-center">
              <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">They're coming!</h2>
              <p className="text-gray-500 text-lg mb-8">The owner has seen your alert and is on their way.</p>
              
              {eta && (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 w-full mb-8">
                  <p className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-2">Estimated Arrival</p>
                  <p className="text-4xl font-extrabold text-secondary">{eta} <span className="text-xl">min</span></p>
                </div>
              )}

              <Button variant="outline" className="w-full h-14" onClick={() => router.push("/")}>
                Finish & Go to ParkPing
              </Button>
            </div>
          )}

          {status === "expired" && (
            <div className="animate-in fade-in flex flex-col items-center">
               <h2 className="text-2xl font-bold text-red-600 mb-2">No Response</h2>
               <p className="text-gray-500 mb-8 max-w-xs">The owner hasn't responded to the app alert within 5 minutes.</p>
               <Button className="w-full h-14 bg-red-500 hover:bg-red-600 border-none text-white shadow-lg">
                 <Phone className="mr-2 w-5 h-5" /> Escalate & Call Owner
               </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
