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
  isPartial: boolean;
}

export type CepErrorType = 'not_found' | 'network_error' | 'invalid_cep';

export interface CepSearchResult {
  success: boolean;
  data?: AddressFromCep;
  errorType?: CepErrorType;
  errorMessage?: string;
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
 * Fetches address data via Edge Function proxy (bypasses CORS)
 * Distinguishes between: CEP not found, network errors, and invalid CEP
 */
export async function fetchAddressByCep(cep: string): Promise<CepSearchResult> {
  const cleanCep = formatCep(cep);
  
  console.log('[CEP] Iniciando busca via backend para:', cleanCep);
  
  // Validate CEP format locally first
  if (cleanCep.length !== 8) {
    console.log('[CEP] CEP inválido - não tem 8 dígitos');
    return { 
      success: false, 
      errorType: 'invalid_cep', 
      errorMessage: 'CEP deve ter 8 dígitos' 
    };
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('[CEP] Timeout - abortando requisição');
    controller.abort();
  }, 8000); // 8 second timeout for Edge Function

  try {
    // Call Edge Function as proxy
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const url = `${supabaseUrl}/functions/v1/cep-lookup?cep=${cleanCep}`;
    
    console.log('[CEP] Chamando Edge Function:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('[CEP] Status da resposta:', response.status);
    
    const result = await response.json();
    console.log('[CEP] Resposta do backend:', result);

    if (result.success && result.data) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      return {
        success: false,
        errorType: result.errorType || 'network_error',
        errorMessage: result.error || 'Erro ao buscar CEP',
      };
    }

  } catch (error: unknown) {
    clearTimeout(timeoutId);
    
    const err = error as Error;
    console.log('[CEP] Erro capturado:', err.name, err.message);
    
    // Handle timeout (AbortError)
    if (err.name === 'AbortError') {
      return { 
        success: false, 
        errorType: 'network_error', 
        errorMessage: 'Tempo limite excedido. Tente novamente.' 
      };
    }
    
    // Handle other network errors
    return { 
      success: false, 
      errorType: 'network_error', 
      errorMessage: 'Não foi possível conectar ao servidor. Tente novamente.' 
    };
  }
}
