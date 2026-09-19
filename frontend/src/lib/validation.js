/**
 * Reusable phone number validation utilities
 * Enforces exactly 10 digits, numeric only, rejects letters, symbols, extra/fewer digits.
 */

export function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return 'Phone number must contain exactly 10 digits.';
  }

  const trimmed = phone.trim();

  if (!trimmed) {
    return 'Phone number must contain exactly 10 digits.';
  }

  // Check for non-digit characters
  if (/[^\d]/.test(trimmed)) {
    return 'Phone number must contain only digits.';
  }

  // Check length
  if (trimmed.length !== 10 || !/^[0-9]{10}$/.test(trimmed)) {
    return 'Phone number must contain exactly 10 digits.';
  }

  return null; // Valid!
}

/**
 * Strips non-digits and caps length to 10
 */
export function sanitizePhoneInput(val) {
  if (!val) return '';
  return String(val).replace(/\D/g, '').slice(0, 10);
}
