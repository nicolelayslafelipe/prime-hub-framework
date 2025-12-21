// ViaCEP API integration for Brazilian postal code lookup

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface AddressFromCep {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  isPartial: boolean; // Indicates if it's a generic city CEP (no street/neighborhood)
}

/**
 * Formats a CEP string by removing non-numeric characters
 */
export function formatCep(cep: string): string {
  return cep.replace(/\D/g, '');
}

/**
 * Validates if a CEP has the correct format (8 digits)
 */
export function isValidCep(cep: string): boolean {
  const cleanCep = formatCep(cep);
  return cleanCep.length === 8;
}

/**
 * Formats CEP for display (00000-000)
 */
export function formatCepForDisplay(cep: string): string {
  const cleanCep = formatCep(cep);
  if (cleanCep.length <= 5) return cleanCep;
  return `${cleanCep.slice(0, 5)}-${cleanCep.slice(5, 8)}`;
}

/**
 * Fetches address data from ViaCEP API
 * @param cep - Brazilian postal code (CEP)
 * @returns Address data or null if not found
 */
export async function fetchAddressByCep(cep: string): Promise<AddressFromCep | null> {
  const cleanCep = formatCep(cep);
  
  if (!isValidCep(cleanCep)) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch address');
    }

    const data: ViaCepResponse = await response.json();

    if (data.erro) {
      return null;
    }

    // CEP found - check if it's a generic city CEP (no street data)
    const isPartial = !data.logradouro || !data.bairro;
    
    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
      isPartial,
    };
  } catch (error) {
    console.error('Error fetching address from CEP:', error);
    return null;
  }
}
