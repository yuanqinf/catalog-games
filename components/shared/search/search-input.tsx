'use client';

import {
  Search as SearchIconLucide,
  X as XIcon,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { CommandInput } from '@/components/ui/command';
import { useTranslation } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';

interface SearchInputProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear: (e: React.MouseEvent) => void;
  onBack?: () => void;
  isActive: boolean;
  isLoading?: boolean;
  readOnly?: boolean;
}

export const SearchInput = ({
  inputRef,
  value,
  onChange,
  onFocus,
  onKeyDown,
  onClear,
  onBack,
  isActive,
  isLoading = false,
  readOnly = false,
}: SearchInputProps) => {
  const { t } = useTranslation();

  return (
    <div className="search-input-wrapper">
      {isLoading ? (
        <Loader2 className="search-icon animate-spin text-gray-400" />
      ) : (
        <>
          {/* Mobile: Show ArrowLeft when active, Desktop: Always show Search icon */}
          {isActive && onBack ? (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft />
            </Button>
          ) : null}
          <SearchIconLucide
            className={`search-icon ${isActive && onBack ? 'hidden md:block' : ''}`}
          />
        </>
      )}
      <CommandInput
        ref={inputRef}
        value={value}
        onValueChange={onChange}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder={t('header_search_placeholder')}
        hideDefaultIcon
        readOnly={readOnly}
        wrapperClassName={`${isActive ? 'w-full' : ''} border-0 p-0 h-full`}
        className={`${isActive ? '' : 'cursor-pointer'} h-full rounded-md border-0 bg-transparent pr-9 ${isActive && onBack ? 'pl-0' : 'pl-9'} text-sm text-gray-100 shadow-none placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0`}
      />
      {value && <XIcon className="search-clear-icon" onClick={onClear} />}
    </div>
  );
};
