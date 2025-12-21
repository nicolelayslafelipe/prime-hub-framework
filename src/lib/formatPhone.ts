/**
 * Formats a Brazilian phone number as the user types
 * Format: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
 */
export function formatBrazilianPhone(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Limit to 11 digits
  const limitedDigits = digits.slice(0, 11);
  
  // Format based on length
  if (limitedDigits.length === 0) {
    return '';
  } else if (limitedDigits.length <= 2) {
    return `(${limitedDigits}`;
  } else if (limitedDigits.length <= 6) {
    return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2)}`;
  } else if (limitedDigits.length <= 10) {
    // Format: (XX) XXXX-XXXX (landline)
    return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 6)}-${limitedDigits.slice(6)}`;
  } else {
    // Format: (XX) XXXXX-XXXX (mobile)
    return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 7)}-${limitedDigits.slice(7)}`;
  }
}

/**
 * Removes formatting from phone number, keeping only digits
 */
export function unformatPhone(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Validates a Brazilian phone number (10-11 digits)
 */
export function isValidBrazilianPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
}
