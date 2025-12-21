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
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('ViaCEP API error:', response.status);
      return null;
    }

    const data: ViaCepResponse = await response.json();

    // Check if CEP was not found (API returns { erro: true })
    if (data.erro) {
      return null;
    }

    // Return whatever data we have - client fills in the rest
    // isPartial = true when we don't have street info (generic city CEP)
    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
      isPartial: !data.logradouro,
    };
  } catch (error) {
    console.error('Error fetching address from CEP:', error);
    return null;
  }
}
