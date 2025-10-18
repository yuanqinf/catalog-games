'use client';

import { KeyboardEvent, MouseEvent } from 'react';
import { Search as SearchIconLucide, X as XIcon, Loader2 } from 'lucide-react';
import { CommandInput } from '@/components/ui/command';
import { useTranslation } from '@/lib/i18n/client';

interface SearchInputProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear: (e: React.MouseEvent) => void;
  isActive: boolean;
  isLoading?: boolean;
}

export const SearchInput = ({
  inputRef,
  value,
  onChange,
  onFocus,
  onKeyDown,
  onClear,
  isActive,
  isLoading = false,
}: SearchInputProps) => {
  const { t } = useTranslation();

  return (
    <div className="search-input-wrapper">
      {isLoading ? (
        <Loader2 className="search-icon animate-spin text-gray-400" />
      ) : (
        <SearchIconLucide className="search-icon" />
      )}
      <CommandInput
        ref={inputRef}
        value={value}
        onValueChange={onChange}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder={t('header_search_placeholder')}
        hideDefaultIcon
        wrapperClassName={`${isActive ? 'w-full' : ''} border-0 p-0 h-full`}
        className={`${isActive ? '' : 'cursor-pointer'} h-full rounded-md border-0 bg-transparent pr-9 pl-9 text-sm text-gray-100 shadow-none placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0`}
      />
      {value && <XIcon className="search-clear-icon" onClick={onClear} />}
    </div>
  );
};
