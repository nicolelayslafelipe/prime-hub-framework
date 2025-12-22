import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAddressSearch, GeocodedAddress } from '@/hooks/useAddressSearch';
import { MapPin, Loader2, Search, X, CheckCircle2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ManualAddressForm } from './ManualAddressForm';

interface AddressAutocompleteProps {
  placeholder?: string;
  onAddressSelect: (address: GeocodedAddress) => void;
  className?: string;
  disabled?: boolean;
  initialValue?: string;
}

export function AddressAutocomplete({
  placeholder = 'Buscar endereço...',
  onAddressSelect,
  className,
  disabled = false,
  initialValue = '',
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const { status, results, search, reset, errorMessage } = useAddressSearch();

  // Debounced search
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    setHasSelected(false);
    setShowManualForm(false);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim().length < 3) {
      reset();
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      search(value);
      setShowDropdown(true);
    }, 300);
  }, [search, reset]);

  // Handle address selection
  const handleSelect = useCallback((address: GeocodedAddress) => {
    setInputValue(address.placeName);
    setShowDropdown(false);
    setHasSelected(true);
    setShowManualForm(false);
    onAddressSelect(address);
    reset();
  }, [onAddressSelect, reset]);

  // Handle manual form submission
  const handleManualSubmit = useCallback((data: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  }) => {
    const fullAddress = `${data.street}, ${data.number}${data.complement ? ` - ${data.complement}` : ''}, ${data.neighborhood}, ${data.city} - ${data.state}`;
    
    const manualAddress: GeocodedAddress = {
      placeId: `manual-${Date.now()}`,
      placeName: fullAddress,
      street: data.street,
      number: data.number,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      postcode: data.zipCode,
      latitude: null,
      longitude: null,
    };

    setInputValue(fullAddress);
    setShowManualForm(false);
    setHasSelected(true);
    onAddressSelect(manualAddress);
  }, [onAddressSelect]);

  // Handle clear
  const handleClear = useCallback(() => {
    setInputValue('');
    setShowDropdown(false);
    setHasSelected(false);
    setShowManualForm(false);
    reset();
    inputRef.current?.focus();
  }, [reset]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Show manual form option when search fails or no results
  const showManualOption = status === 'error' || (status === 'success' && results.length === 0 && inputValue.length >= 3);

  if (showManualForm) {
    return (
      <div className={className}>
        <ManualAddressForm
          onSubmit={handleManualSubmit}
          onCancel={() => setShowManualForm(false)}
        />
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0 && !hasSelected) {
              setShowDropdown(true);
            }
          }}
          disabled={disabled}
          className={cn(
            'pl-9 pr-10 bg-background',
            hasSelected && 'border-green-500 focus-visible:ring-green-500'
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {status === 'loading' && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {hasSelected && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {inputValue && !hasSelected && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Dropdown with results */}
      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {results.map((address) => (
            <button
              key={address.placeId}
              type="button"
              onClick={() => handleSelect(address)}
              className="w-full flex items-start gap-3 p-3 text-left hover:bg-accent transition-colors border-b border-border/50 last:border-0"
            >
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">{address.placeName}</p>
                {address.postcode && (
                  <p className="text-xs text-muted-foreground">CEP: {address.postcode}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message with manual fallback */}
      {showDropdown && status === 'success' && results.length === 0 && inputValue.length >= 3 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-4"
        >
          <p className="text-sm text-muted-foreground text-center">
            Nenhum endereço encontrado
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowManualForm(true)}
            className="w-full mt-3 gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Preencher manualmente
          </Button>
        </div>
      )}

      {/* Error message with manual fallback */}
      {status === 'error' && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-destructive">
            {errorMessage || 'Não foi possível buscar endereços.'}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowManualForm(true)}
            className="w-full gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Preencher endereço manualmente
          </Button>
        </div>
      )}
    </div>
  );
}
