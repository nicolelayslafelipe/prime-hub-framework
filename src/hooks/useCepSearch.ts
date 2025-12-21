import { useState, useCallback, useRef } from 'react';
import { fetchAddressByCep, formatCep, AddressFromCep } from '@/lib/cep';
import { toast } from 'sonner';

export type CepSearchStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseCepSearchReturn {
  status: CepSearchStatus;
  addressData: AddressFromCep | null;
  search: (cep: string) => Promise<AddressFromCep | null>;
  reset: () => void;
  lastSearchedCep: string | null;
}

/**
 * Hook reutilizável para busca de CEP
 * - Evita loops infinitos: busca apenas quando chamada explicitamente
 * - Previne buscas simultâneas
 * - Não repete busca para o mesmo CEP já encontrado
 */
export function useCepSearch(): UseCepSearchReturn {
  const [status, setStatus] = useState<CepSearchStatus>('idle');
  const [addressData, setAddressData] = useState<AddressFromCep | null>(null);
  const [lastSearchedCep, setLastSearchedCep] = useState<string | null>(null);
  
  // Flag para evitar chamadas simultâneas
  const isSearchingRef = useRef(false);

  const search = useCallback(async (cep: string): Promise<AddressFromCep | null> => {
    const cleanCep = formatCep(cep);
    
    // Validação: precisa ter 8 dígitos
    if (cleanCep.length !== 8) {
      return null;
    }
    
    // Se já buscou este CEP com sucesso, retornar dados em cache
    if (cleanCep === lastSearchedCep && status === 'success' && addressData) {
      return addressData;
    }
    
    // Prevenir busca se já está buscando
    if (isSearchingRef.current) {
      return null;
    }
    
    isSearchingRef.current = true;
    setStatus('loading');
    setLastSearchedCep(cleanCep);
    
    try {
      const result = await fetchAddressByCep(cleanCep);
      
      if (result) {
        setAddressData(result);
        setStatus('success');
        isSearchingRef.current = false;
        return result;
      } else {
        setAddressData(null);
        setStatus('error');
        isSearchingRef.current = false;
        return null;
      }
    } catch (error) {
      console.error('CEP search error:', error);
      setAddressData(null);
      setStatus('error');
      isSearchingRef.current = false;
      return null;
    }
  }, [status, lastSearchedCep, addressData]);

  const reset = useCallback(() => {
    setStatus('idle');
    setAddressData(null);
    setLastSearchedCep(null);
    isSearchingRef.current = false;
  }, []);

  return { status, addressData, search, reset, lastSearchedCep };
}
