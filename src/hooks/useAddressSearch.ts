import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GeocodedAddress {
  placeId: string;
  placeName: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postcode: string;
  latitude: number;
  longitude: number;
}

export type AddressSearchStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseAddressSearchReturn {
  status: AddressSearchStatus;
  results: GeocodedAddress[];
  errorMessage: string | null;
  search: (query: string) => Promise<void>;
  reset: () => void;
  selectAddress: (address: GeocodedAddress) => void;
  selectedAddress: GeocodedAddress | null;
}

/**
 * Hook for address search using Mapbox Geocoding via Edge Function
 * - Debounce handled externally (component responsibility)
 * - Caches results for same queries
 * - Prevents concurrent requests
 */
export function useAddressSearch(): UseAddressSearchReturn {
  const [status, setStatus] = useState<AddressSearchStatus>('idle');
  const [results, setResults] = useState<GeocodedAddress[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<GeocodedAddress | null>(null);
  
  // Prevent concurrent requests
  const isSearchingRef = useRef(false);
  // Cache results
  const cacheRef = useRef<Map<string, GeocodedAddress[]>>(new Map());

  const search = useCallback(async (query: string): Promise<void> => {
    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length < 3) {
      setResults([]);
      setStatus('idle');
      return;
    }

    // Check cache
    const cached = cacheRef.current.get(trimmedQuery.toLowerCase());
    if (cached) {
      setResults(cached);
      setStatus('success');
      setErrorMessage(null);
      return;
    }

    // Prevent concurrent requests
    if (isSearchingRef.current) {
      return;
    }

    isSearchingRef.current = true;
    setStatus('loading');
    setErrorMessage(null);

    try {
      // Use Supabase client to call edge function
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { q: trimmedQuery },
      });

      if (error) {
        console.error('[useAddressSearch] Supabase error:', error);
        setResults([]);
        setStatus('error');
        setErrorMessage(error.message || 'Erro ao buscar endereço');
        isSearchingRef.current = false;
        return;
      }

      if (data?.success && Array.isArray(data.results)) {
        setResults(data.results);
        setStatus('success');
        setErrorMessage(null);
        // Cache results
        cacheRef.current.set(trimmedQuery.toLowerCase(), data.results);
      } else {
        setResults([]);
        setStatus('error');
        setErrorMessage(data?.error || 'Erro ao buscar endereço');
      }
    } catch (error) {
      console.error('[useAddressSearch] Error:', error);
      setResults([]);
      setStatus('error');
      setErrorMessage('Não foi possível buscar endereços. Tente novamente.');
    } finally {
      isSearchingRef.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResults([]);
    setErrorMessage(null);
    setSelectedAddress(null);
    isSearchingRef.current = false;
  }, []);

  const selectAddress = useCallback((address: GeocodedAddress) => {
    setSelectedAddress(address);
    setResults([]);
    setStatus('idle');
  }, []);

  return { 
    status, 
    results, 
    errorMessage, 
    search, 
    reset, 
    selectAddress,
    selectedAddress 
  };
}
