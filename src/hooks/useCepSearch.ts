import { useState, useCallback, useRef } from 'react';
import { fetchAddressByCep, formatCep, AddressFromCep, CepSearchResult, CepErrorType } from '@/lib/cep';

export type CepSearchStatus = 'idle' | 'loading' | 'success' | 'not_found' | 'network_error';

interface UseCepSearchReturn {
  status: CepSearchStatus;
  addressData: AddressFromCep | null;
  errorMessage: string | null;
  search: (cep: string) => Promise<CepSearchResult>;
  reset: () => void;
  lastSearchedCep: string | null;
}

/**
 * Hook reutilizável para busca de CEP com tratamento robusto de erros
 * - Diferencia entre CEP não encontrado e erro de rede
 * - Evita loops infinitos: busca apenas quando chamada explicitamente
 * - Previne buscas simultâneas
 * - Não repete busca para o mesmo CEP já encontrado
 */
export function useCepSearch(): UseCepSearchReturn {
  const [status, setStatus] = useState<CepSearchStatus>('idle');
  const [addressData, setAddressData] = useState<AddressFromCep | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSearchedCep, setLastSearchedCep] = useState<string | null>(null);
  
  // Flag para evitar chamadas simultâneas
  const isSearchingRef = useRef(false);
  // Cache de resultados de sucesso
  const cacheRef = useRef<Map<string, AddressFromCep>>(new Map());

  const search = useCallback(async (cep: string): Promise<CepSearchResult> => {
    const cleanCep = formatCep(cep);
    
    // Validação: precisa ter 8 dígitos
    if (cleanCep.length !== 8) {
      return { success: false, errorType: 'invalid_cep', errorMessage: 'CEP deve ter 8 dígitos' };
    }
    
    // Se já buscou este CEP com sucesso, retornar dados em cache
    const cached = cacheRef.current.get(cleanCep);
    if (cached) {
      setAddressData(cached);
      setStatus('success');
      setErrorMessage(null);
      return { success: true, data: cached };
    }
    
    // Prevenir busca se já está buscando
    if (isSearchingRef.current) {
      return { success: false, errorType: 'network_error', errorMessage: 'Busca em andamento' };
    }
    
    isSearchingRef.current = true;
    setStatus('loading');
    setErrorMessage(null);
    setLastSearchedCep(cleanCep);
    
    try {
      const result = await fetchAddressByCep(cleanCep);
      
      if (result.success && result.data) {
        setAddressData(result.data);
        setStatus('success');
        setErrorMessage(null);
        // Cachear resultado de sucesso
        cacheRef.current.set(cleanCep, result.data);
        isSearchingRef.current = false;
        return result;
      } else {
        setAddressData(null);
        setErrorMessage(result.errorMessage || 'Erro desconhecido');
        
        // Definir status baseado no tipo de erro
        if (result.errorType === 'not_found') {
          setStatus('not_found');
        } else {
          setStatus('network_error');
        }
        
        isSearchingRef.current = false;
        return result;
      }
    } catch (error) {
      console.error('[useCepSearch] Erro inesperado:', error);
      setAddressData(null);
      setStatus('network_error');
      setErrorMessage('Erro inesperado ao buscar CEP');
      isSearchingRef.current = false;
      return { success: false, errorType: 'network_error', errorMessage: 'Erro inesperado' };
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setAddressData(null);
    setErrorMessage(null);
    setLastSearchedCep(null);
    isSearchingRef.current = false;
  }, []);

  return { status, addressData, errorMessage, search, reset, lastSearchedCep };
}
