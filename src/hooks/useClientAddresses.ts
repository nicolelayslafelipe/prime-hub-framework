import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ClientAddress {
  id: string;
  user_id: string;
  label: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  reference: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useClientAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<ClientAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const getDefaultAddress = useCallback((): ClientAddress | null => {
    return addresses.find(addr => addr.is_default) || addresses[0] || null;
  }, [addresses]);

  const formatAddressForDisplay = useCallback((address: ClientAddress): string => {
    let formatted = `${address.street}, ${address.number}`;
    if (address.complement) formatted += ` - ${address.complement}`;
    formatted += ` - ${address.neighborhood}, ${address.city} - ${address.state}`;
    return formatted;
  }, []);

  const formatAddressShort = useCallback((address: ClientAddress): string => {
    return `${address.street}, ${address.number} - ${address.neighborhood}`;
  }, []);

  const validateAddress = useCallback((address: ClientAddress | null): boolean => {
    if (!address) return false;
    
    const cleanZip = address.zip_code.replace(/\D/g, '');
    
    return !!(
      address.street?.trim() &&
      address.number?.trim() &&
      address.neighborhood?.trim() &&
      address.city?.trim() &&
      address.state?.trim() &&
      cleanZip.length === 8
    );
  }, []);

  const getValidationErrors = useCallback((address: Partial<ClientAddress> | null): string[] => {
    const errors: string[] = [];
    
    if (!address) {
      errors.push('Selecione ou adicione um endereço de entrega');
      return errors;
    }
    
    if (!address.street?.trim()) errors.push('Rua é obrigatória');
    if (!address.number?.trim()) errors.push('Número é obrigatório');
    if (!address.neighborhood?.trim()) errors.push('Bairro é obrigatório');
    if (!address.city?.trim()) errors.push('Cidade é obrigatória');
    if (!address.state?.trim()) errors.push('Estado é obrigatório');
    
    const cleanZip = address.zip_code?.replace(/\D/g, '') || '';
    if (cleanZip.length !== 8) errors.push('CEP inválido');
    
    return errors;
  }, []);

  return {
    addresses,
    isLoading,
    getDefaultAddress,
    formatAddressForDisplay,
    formatAddressShort,
    validateAddress,
    getValidationErrors,
    refetch: fetchAddresses,
  };
}
