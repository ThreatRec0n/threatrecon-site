import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizeEmail(email?: string): string | undefined {
  if (!email) return undefined;
  const trimmed = email.trim().toLowerCase();
  // Basic normalization; do not attempt provider-specific rules to avoid mistakes
  return trimmed;
}

export function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const parsed = parsePhoneNumberFromString(phone, 'US');
  if (!parsed || !parsed.isValid()) return undefined;
  return parsed.number; // E.164
}

export function normalizeName(name?: string): string | undefined {
  if (!name) return undefined;
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function normalizeAddress(address?: string): string | undefined {
  if (!address) return undefined;
  return address.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function normalizeUsername(username?: string): string | undefined {
  if (!username) return undefined;
  return username.trim().toLowerCase();
}
