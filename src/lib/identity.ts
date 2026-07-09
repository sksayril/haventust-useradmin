import type { Model } from "mongoose";
import type { IUser } from "@/models/User";

export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 10) {
    return digits;
  }
  return null;
}

export function isValidIndianMobile(normalizedPhone: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizedPhone);
}

export function formatPhoneDisplay(normalizedPhone: string): string {
  return `+91 ${normalizedPhone.slice(0, 5)} ${normalizedPhone.slice(5)}`;
}

interface IdentityCheckInput {
  email?: string;
  phoneNormalized?: string;
  excludeUserId?: string;
}

export async function findIdentityConflict(
  User: Model<IUser>,
  input: IdentityCheckInput
): Promise<string | null> {
  const { email, phoneNormalized, excludeUserId } = input;
  const excludeFilter = excludeUserId ? { _id: { $ne: excludeUserId } } : {};

  if (email) {
    const existing = await User.findOne({
      email: email.toLowerCase().trim(),
      ...excludeFilter,
    }).select("_id");
    if (existing) return "An account with this email already exists.";
  }

  if (phoneNormalized) {
    const existing = await User.findOne({
      phoneNormalized,
      ...excludeFilter,
    }).select("_id");
    if (existing) return "An account with this mobile number already exists.";
  }

  return null;
}

export function getDuplicateKeyMessage(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error) || error.code !== 11000) {
    return null;
  }

  const keyPattern = "keyPattern" in error && error.keyPattern && typeof error.keyPattern === "object"
    ? error.keyPattern as Record<string, unknown>
    : {};

  if ("email" in keyPattern) return "An account with this email already exists.";
  if ("phoneNormalized" in keyPattern) return "An account with this mobile number already exists.";

  return "An account with these details already exists.";
}
