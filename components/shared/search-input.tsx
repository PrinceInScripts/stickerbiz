'use client';

/**
 * SearchInput — debounced search field with icon.
 */

import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  placeholder = 'Search...',
  value: externalValue,
  onChange,
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(externalValue || '');

  // Sync with external value
  useEffect(() => {
    if (externalValue !== undefined) {
      setInternalValue(externalValue);
    }
  }, [externalValue]);

  // Debounced onChange
  const debouncedOnChange = useCallback(
    (val: string) => {
      const timer = setTimeout(() => onChange(val), debounceMs);
      return () => clearTimeout(timer);
    },
    [onChange, debounceMs]
  );

  useEffect(() => {
    const cleanup = debouncedOnChange(internalValue);
    return cleanup;
  }, [internalValue, debouncedOnChange]);

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        className="pl-9 pr-9"
      />
      {internalValue && (
        <button
          onClick={() => {
            setInternalValue('');
            onChange('');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
