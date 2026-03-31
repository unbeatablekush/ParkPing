import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ParkPing - No more blocked cars",
  description: "Scan. Ping. Move. ParkPing lets you anonymously contact any blocked car owner in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased text-foreground bg-background min-h-screen flex flex-col`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
