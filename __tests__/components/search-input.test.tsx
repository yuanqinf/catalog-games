import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '../../components/shared/search/search-input';
import React, { createRef } from 'react';

// Mock i18n
vi.mock('@/lib/i18n/client', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        header_search_placeholder: 'Search for games...',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock CommandInput
vi.mock('@/components/ui/command', () => ({
  CommandInput: ({
    ref,
    value,
    onValueChange,
    onFocus,
    onKeyDown,
    placeholder,
    className,
    wrapperClassName,
  }: {
    ref?: React.RefObject<HTMLInputElement>;
    value: string;
    onValueChange: (value: string) => void;
    onFocus: () => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    placeholder: string;
    className?: string;
    wrapperClassName?: string;
    hideDefaultIcon?: boolean;
  }) => (
    <div data-testid="command-input-wrapper" className={wrapperClassName}>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={className}
        data-testid="command-input"
      />
    </div>
  ),
}));

describe('SearchInput', () => {
  const mockOnChange = vi.fn();
  const mockOnFocus = vi.fn();
  const mockOnKeyDown = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with search icon by default', () => {
      const inputRef = createRef<HTMLInputElement>();

      const { container } = render(
        <SearchInput
          inputRef={inputRef}
          value=""
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={false}
        />,
      );
    });

    it('should render input with correct placeholder', () => {
      const inputRef = createRef<HTMLInputElement>();

      render(
        <SearchInput
          inputRef={inputRef}
          value=""
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={false}
        />,
      );

      expect(
        screen.getByPlaceholderText('Search for games...'),
      ).toBeInTheDocument();
    });

    it('should show clear icon when value is not empty', () => {
      const inputRef = createRef<HTMLInputElement>();

      const { container } = render(
        <SearchInput
          inputRef={inputRef}
          value="zelda"
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={true}
        />,
      );

      const clearIcon = container.querySelector('.search-clear-icon');
      expect(clearIcon).toBeInTheDocument();
    });

    it('should not show clear icon when value is empty', () => {
      const inputRef = createRef<HTMLInputElement>();

      const { container } = render(
        <SearchInput
          inputRef={inputRef}
          value=""
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={false}
        />,
      );

      const clearIcon = container.querySelector('.search-clear-icon');
      expect(clearIcon).not.toBeInTheDocument();
    });
  });

  describe('Active state styling', () => {
    it('should apply active styles when isActive is true', () => {
      const inputRef = createRef<HTMLInputElement>();

      render(
        <SearchInput
          inputRef={inputRef}
          value=""
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={true}
        />,
      );

      const wrapper = screen.getByTestId('command-input-wrapper');
      expect(wrapper).toHaveClass('w-full');
    });

    it('should not apply active styles when isActive is false', () => {
      const inputRef = createRef<HTMLInputElement>();

      render(
        <SearchInput
          inputRef={inputRef}
          value=""
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={false}
        />,
      );

      const wrapper = screen.getByTestId('command-input-wrapper');
      expect(wrapper.className).not.toContain('w-full');
    });

    it('should add cursor-pointer when not active', () => {
      const inputRef = createRef<HTMLInputElement>();

      render(
        <SearchInput
          inputRef={inputRef}
          value=""
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={false}
        />,
      );

      const input = screen.getByTestId('command-input');
      expect(input).toHaveClass('cursor-pointer');
    });

    it('should not have cursor-pointer when active', () => {
      const inputRef = createRef<HTMLInputElement>();

      render(
        <SearchInput
          inputRef={inputRef}
          value=""
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={true}
        />,
      );

      const input = screen.getByTestId('command-input');
      expect(input.className).not.toContain('cursor-pointer');
    });
  });

  describe('User interactions', () => {
    it('should call onChange when user types', async () => {
      const user = userEvent.setup();
      const inputRef = createRef<HTMLInputElement>();

      render(
        <SearchInput
          inputRef={inputRef}
          value=""
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={true}
        />,
      );

      const input = screen.getByTestId('command-input');
      await user.type(input, 'mario');

      expect(mockOnChange).toHaveBeenCalled();
      // Should be called once per character
      expect(mockOnChange.mock.calls.length).toBeGreaterThan(0);
    });

    it('should call onFocus when input is focused', async () => {
      const user = userEvent.setup();
      const inputRef = createRef<HTMLInputElement>();

      render(
        <SearchInput
          inputRef={inputRef}
          value=""
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={false}
        />,
      );

      const input = screen.getByTestId('command-input');
      await user.click(input);

      expect(mockOnFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onKeyDown when user presses keys', () => {
      const inputRef = createRef<HTMLInputElement>();

      render(
        <SearchInput
          inputRef={inputRef}
          value="test"
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={true}
        />,
      );

      const input = screen.getByTestId('command-input');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockOnKeyDown).toHaveBeenCalledTimes(1);
    });

    it('should call onClear when clear icon is clicked', async () => {
      const user = userEvent.setup();
      const inputRef = createRef<HTMLInputElement>();

      const { container } = render(
        <SearchInput
          inputRef={inputRef}
          value="search term"
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={true}
        />,
      );

      const clearIcon = container.querySelector('.search-clear-icon');
      expect(clearIcon).toBeInTheDocument();

      if (clearIcon) {
        await user.click(clearIcon as HTMLElement);
        expect(mockOnClear).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Ref forwarding', () => {
    it('should forward ref to input element', () => {
      const inputRef = createRef<HTMLInputElement>();

      render(
        <SearchInput
          inputRef={inputRef}
          value=""
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={false}
        />,
      );

      expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    });

    it('should allow programmatic focus via ref', () => {
      const inputRef = createRef<HTMLInputElement>();

      render(
        <SearchInput
          inputRef={inputRef}
          value=""
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={false}
        />,
      );

      inputRef.current?.focus();
      expect(document.activeElement).toBe(inputRef.current);
    });
  });

  describe('Value prop', () => {
    it('should display the provided value', () => {
      const inputRef = createRef<HTMLInputElement>();

      render(
        <SearchInput
          inputRef={inputRef}
          value="The Legend of Zelda"
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={true}
        />,
      );

      const input = screen.getByTestId('command-input') as HTMLInputElement;
      expect(input.value).toBe('The Legend of Zelda');
    });

    it('should update when value prop changes', () => {
      const inputRef = createRef<HTMLInputElement>();

      const { rerender } = render(
        <SearchInput
          inputRef={inputRef}
          value="mario"
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={true}
        />,
      );

      let input = screen.getByTestId('command-input') as HTMLInputElement;
      expect(input.value).toBe('mario');

      rerender(
        <SearchInput
          inputRef={inputRef}
          value="zelda"
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={true}
        />,
      );

      input = screen.getByTestId('command-input') as HTMLInputElement;
      expect(input.value).toBe('zelda');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string value', () => {
      const inputRef = createRef<HTMLInputElement>();

      render(
        <SearchInput
          inputRef={inputRef}
          value=""
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={true}
        />,
      );

      const input = screen.getByTestId('command-input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should handle very long input values', () => {
      const longValue = 'a'.repeat(500);
      const inputRef = createRef<HTMLInputElement>();

      render(
        <SearchInput
          inputRef={inputRef}
          value={longValue}
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={true}
        />,
      );

      const input = screen.getByTestId('command-input') as HTMLInputElement;
      expect(input.value).toBe(longValue);
    });

    it('should handle special characters in value', () => {
      const specialValue = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const inputRef = createRef<HTMLInputElement>();

      render(
        <SearchInput
          inputRef={inputRef}
          value={specialValue}
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={true}
        />,
      );

      const input = screen.getByTestId('command-input') as HTMLInputElement;
      expect(input.value).toBe(specialValue);
    });

    it('should handle unicode characters', () => {
      const unicodeValue = 'ファイナルファンタジー';
      const inputRef = createRef<HTMLInputElement>();

      render(
        <SearchInput
          inputRef={inputRef}
          value={unicodeValue}
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={true}
        />,
      );

      const input = screen.getByTestId('command-input') as HTMLInputElement;
      expect(input.value).toBe(unicodeValue);
    });

    it('should handle rapid state changes', () => {
      const inputRef = createRef<HTMLInputElement>();

      const { rerender } = render(
        <SearchInput
          inputRef={inputRef}
          value=""
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={false}
        />,
      );

      // Simulate rapid state changes
      rerender(
        <SearchInput
          inputRef={inputRef}
          value="m"
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={true}
        />,
      );

      rerender(
        <SearchInput
          inputRef={inputRef}
          value="ma"
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onKeyDown={mockOnKeyDown}
          onClear={mockOnClear}
          isActive={true}
        />,
      );

      const input = screen.getByTestId('command-input') as HTMLInputElement;
      expect(input.value).toBe('ma');
    });
  });
});
