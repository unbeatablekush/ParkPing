import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format an Indian license plate: MH 01 AB 1234
export function formatCarNumber(val: string) {
  const alphanumeric = val.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (alphanumeric.length <= 2) return alphanumeric;
  if (alphanumeric.length <= 4) return `${alphanumeric.slice(0, 2)} ${alphanumeric.slice(2)}`;
  if (alphanumeric.length <= 6) return `${alphanumeric.slice(0, 2)} ${alphanumeric.slice(2, 4)} ${alphanumeric.slice(4)}`;
  return `${alphanumeric.slice(0, 2)} ${alphanumeric.slice(2, 4)} ${alphanumeric.slice(4, 6)} ${alphanumeric.slice(6, 10)}`;
}

// Format phone number to standard Indian +91
export function formatPhone(val: string) {
  let digits = val.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length > 10) {
    digits = digits.slice(2);
  }
  return `+91 ${digits.slice(0, 10)}`;
}

// Generate a unique qr_code_string like "qr_x7k2m9p4"
export function generateQRCodeString(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'qr_';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const PARKPING_URL = 'https://parkping.vercel.app';
