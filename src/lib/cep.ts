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
 * Fetches address data from ViaCEP API with robust error handling
 * Distinguishes between: CEP not found, network errors, and invalid CEP
 */
export async function fetchAddressByCep(cep: string): Promise<CepSearchResult> {
  const cleanCep = formatCep(cep);
  
  console.log('[CEP] Iniciando busca para:', cleanCep);
  
  // Validate CEP format
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
  }, 5000); // 5 second timeout

  try {
    const url = `https://viacep.com.br/ws/${cleanCep}/json/`;
    console.log('[CEP] Fazendo requisição para:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('[CEP] Status da resposta:', response.status);
    
    if (!response.ok) {
      console.log('[CEP] Erro HTTP:', response.status);
      return { 
        success: false, 
        errorType: 'network_error', 
        errorMessage: `Erro ao conectar ao serviço (HTTP ${response.status})` 
      };
    }

    const data: ViaCepResponse = await response.json();
    console.log('[CEP] Dados recebidos:', data);

    // ViaCEP returns { erro: true } when CEP is not found
    if (data.erro === true) {
      console.log('[CEP] CEP não encontrado na base do ViaCEP');
      return { 
        success: false, 
        errorType: 'not_found', 
        errorMessage: 'CEP não encontrado' 
      };
    }

    // Success - map response to our format
    const result: CepSearchResult = {
      success: true,
      data: {
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        isPartial: !data.logradouro, // Generic city CEP if no street
      }
    };
    
    console.log('[CEP] Resultado final:', result);
    return result;

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
      errorMessage: 'Não foi possível conectar ao serviço de CEP. Tente novamente.' 
    };
  }
}
