import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phoneNumber: string | null | undefined): string {
  if (!phoneNumber) return '-';

  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');

  // Check if it matches +52xxxxxxxxxx (Mexico) or similar length
  if (cleaned.startsWith('+52') && cleaned.length === 13) {
    const code = cleaned.substring(0, 3); // +52
    const rest = cleaned.substring(3); // 10 digits
    return `${code} ${rest.slice(0, 3)}-${rest.slice(3, 6)}-${rest.slice(6)}`;
  }

  // Fallback for just 10 digits
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phoneNumber;
}
