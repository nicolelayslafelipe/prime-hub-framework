import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAddressSearch, GeocodedAddress } from '@/hooks/useAddressSearch';
import { MapPin, Loader2, Search, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const { status, results, search, reset } = useAddressSearch();

  // Debounced search
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    setHasSelected(false);
    
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
    onAddressSelect(address);
    reset();
  }, [onAddressSelect, reset]);

  // Handle clear
  const handleClear = useCallback(() => {
    setInputValue('');
    setShowDropdown(false);
    setHasSelected(false);
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

      {/* No results message */}
      {showDropdown && status === 'success' && results.length === 0 && inputValue.length >= 3 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-4 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Nenhum endereço encontrado
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tente digitar mais detalhes
          </p>
        </div>
      )}

      {/* Error message */}
      {status === 'error' && (
        <p className="text-xs text-destructive mt-1">
          Não foi possível buscar endereços. Preencha manualmente.
        </p>
      )}
    </div>
  );
}
