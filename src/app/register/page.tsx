"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Car, Camera, CheckCircle2, Download } from "lucide-react";
import { formatCarNumber, generateQRCodeString, PARKPING_URL } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastProvider";
import { createClient } from "@/lib/supabase/client";
import { QRCodeSVG } from "qrcode.react";

export default function RegisterVehiclePage() {
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrCodeString, setQrCodeString] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    fullName: "",
    carNumber: "",
    make: "",
    model: "",
    color: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.carNumber || !form.make || !form.model || !form.fullName) {
       return toast("Please fill in all mandatory fields.", "error");
    }

    setLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
       toast("You must be logged in to register a vehicle.", "error");
       setLoading(false);
       return;
    }

    // Insert vehicle
    const { data: vehicle, error: vehError } = await supabase.from('vehicles').insert({
        user_id: session.user.id,
        car_number: form.carNumber,
        make: form.make,
        model: form.model,
        color: form.color || null,
    }).select('id').single();

    if (vehError || !vehicle) {
       toast("Failed to register vehicle: " + (vehError?.message || "Unknown error"), "error");
       setLoading(false);
       return;
    }

    // Auto-generate QR code
    const qrString = generateQRCodeString();
    const { error: qrError } = await supabase.from('qr_codes').insert({
      vehicle_id: vehicle.id,
      qr_code_string: qrString,
      is_active: true,
      delivery_status: 'pending',
    });

    if (!qrError) {
      setQrCodeString(qrString);
    } else {
      console.error("QR code creation failed:", qrError);
    }

    setLoading(false);
    setSuccess(true);
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    canvas.width = 512;
    canvas.height = 512;
    
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement('a');
      link.download = `parkping-${form.carNumber.replace(/\s/g, '')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center shadow-xl">
            {qrCodeString ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your QR Code is Ready! 🎉</h2>
                <p className="text-gray-500 mb-6 text-sm">
                  Your car <strong>{form.carNumber}</strong> is now registered with ParkPing.
                </p>

                <div ref={qrRef} className="bg-white border-2 border-gray-100 rounded-2xl p-6 inline-block shadow-lg mb-6">
                  <QRCodeSVG
                    value={`${PARKPING_URL}/scan?code=${qrCodeString}`}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#1A1A2E"
                    level="H"
                    includeMargin={true}
                  />
                  <p className="text-xs text-gray-400 font-mono mt-2">{qrCodeString}</p>
                </div>

                <div className="space-y-3">
                  <Button className="w-full h-12" variant="outline" onClick={handleDownloadQR}>
                    <Download className="w-4 h-4 mr-2" /> Download QR Code
                  </Button>

                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-left">
                    <p className="text-sm font-semibold text-orange-800 mb-1">📋 Instructions</p>
                    <p className="text-xs text-orange-700 leading-relaxed">
                      Print this QR code and stick it on your windshield (front and back).
                      You can also order a premium weather-proof sticker from your dashboard.
                    </p>
                  </div>

                  <Button className="w-full h-12" onClick={() => router.push("/dashboard")}>
                    Go to Dashboard
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Registered!</h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Your car <strong>{form.carNumber}</strong> is securely saved in your ParkPing account.
                </p>
                <Button className="w-full h-12" onClick={() => router.push("/dashboard")}>
                  Go to Dashboard
                </Button>
              </>
            )}
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <Car className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-secondary tracking-tight">Register Your Vehicle</h1>
          <p className="mt-2 text-gray-500 max-w-lg mx-auto">Link your car&apos;s details securely to your verified phone number.</p>
        </div>

        <Card className="shadow-lg border-0 overflow-hidden">
          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name (As per RC)</label>
                  <input
                    type="text"
                    required
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                    placeholder="Rahul Sharma"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Registration Number</label>
                  <input
                    type="text"
                    required
                    className="w-full h-14 px-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white text-xl font-bold text-gray-900 tracking-wider uppercase placeholder:text-gray-300 placeholder:font-normal placeholder:tracking-normal"
                    placeholder="MH 01 AB 1234"
                    value={form.carNumber}
                    onChange={(e) => setForm({ ...form, carNumber: formatCarNumber(e.target.value) })}
                    maxLength={13}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Car Company (Make)</label>
                  <select
                    required
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                    value={form.make}
                    onChange={(e) => setForm({ ...form, make: e.target.value })}
                  >
                    <option value="">Select Company</option>
                    {["Maruti Suzuki", "Hyundai", "Tata", "Honda", "Toyota", "Mahindra", "Kia", "MG", "Volkswagen", "Skoda", "Renault", "Nissan", "Ford", "BMW", "Mercedes-Benz", "Audi", "Jeep", "Citroen", "Other"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <input
                    type="text"
                    required
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                    placeholder="Creta, Swift, etc."
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <input
                    type="text"
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                    placeholder="Phantom Black"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">RC Book Photo (Optional for manual verification)</label>
                <div className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-3 group-hover:text-primary transition-colors" />
                  <p className="text-sm font-medium text-primary">Upload RC Photo</p>
                  <p className="text-xs text-gray-400 mt-1">PNG or JPG up to 5MB</p>
                </div>
              </div>

              <Button type="submit" className="w-full h-14 text-lg" isLoading={loading}>
                Register My Car
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
