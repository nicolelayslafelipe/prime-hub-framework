// Phone validation utilities for Brazilian phone numbers

/**
 * Validates a Brazilian phone number
 * Accepts formats: (11) 99999-9999, 11999999999, +55 11 99999-9999
 */
export function isValidBrazilianPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Brazilian phone numbers should be:
  // - 10 digits for landlines (with DDD)
  // - 11 digits for mobile phones (with DDD)
  // - 12-13 digits if includes country code (+55)
  
  if (cleaned.length === 10 || cleaned.length === 11) {
    // DDD must be between 11 and 99
    const ddd = parseInt(cleaned.substring(0, 2), 10);
    if (ddd < 11 || ddd > 99) return false;
    
    // Mobile phones start with 9 after DDD (for 11 digits)
    if (cleaned.length === 11) {
      const firstDigit = cleaned.charAt(2);
      if (firstDigit !== '9') return false;
    }
    
    return true;
  }
  
  // With country code (55)
  if (cleaned.length === 12 || cleaned.length === 13) {
    if (!cleaned.startsWith('55')) return false;
    const phoneWithoutCountry = cleaned.substring(2);
    return isValidBrazilianPhone(phoneWithoutCountry);
  }
  
  return false;
}

/**
 * Formats a phone number to the standard Brazilian format
 * Example: 11999999999 -> (11) 99999-9999
 */
export function formatBrazilianPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Remove country code if present
  const phoneWithoutCountry = cleaned.startsWith('55') && cleaned.length > 11
    ? cleaned.substring(2)
    : cleaned;
  
  if (phoneWithoutCountry.length === 11) {
    // Mobile: (11) 99999-9999
    return `(${phoneWithoutCountry.substring(0, 2)}) ${phoneWithoutCountry.substring(2, 7)}-${phoneWithoutCountry.substring(7)}`;
  } else if (phoneWithoutCountry.length === 10) {
    // Landline: (11) 9999-9999
    return `(${phoneWithoutCountry.substring(0, 2)}) ${phoneWithoutCountry.substring(2, 6)}-${phoneWithoutCountry.substring(6)}`;
  }
  
  return phone; // Return original if cannot format
}

/**
 * Mask input as user types
 */
export function maskPhoneInput(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 2) {
    return `(${cleaned}`;
  } else if (cleaned.length <= 7) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2)}`;
  } else if (cleaned.length <= 11) {
    const separator = cleaned.length > 10 ? 5 : 4;
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 2 + separator)}-${cleaned.substring(2 + separator)}`;
  }
  
  return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
}
