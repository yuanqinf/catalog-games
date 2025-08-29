'use client';

import React, { useState } from 'react';
import {
  SortAscIcon,
  SortDescIcon,
  ChartNoAxesCombined,
  StarIcon,
  Calendar,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export type SortOption = 'Trend' | 'Latest' | 'Rating';
export type SortOrder = 'asc' | 'desc';

interface SortingDropdownProps {
  onSortChange?: (option: SortOption, order: SortOrder) => void;
  currentOption?: SortOption;
  currentOrder?: SortOrder;
}

interface SortOptionItemProps {
  option: SortOption;
  isSelected: boolean;
  sortOrder: SortOrder;
  onSelect: (option: SortOption) => void;
  onToggleOrder: (option: SortOption) => void;
}

const SORT_OPTIONS: SortOption[] = ['Trend', 'Latest', 'Rating'];

const getOptionIcon = (option: SortOption) => {
  switch (option) {
    case 'Trend':
      return <ChartNoAxesCombined className="mr-2 h-4 w-4" />;
    case 'Latest':
      return <Calendar className="mr-2 h-4 w-4" />;
    case 'Rating':
      return <StarIcon className="mr-2 h-4 w-4" />;
    default:
      return null;
  }
};

const SortOptionItem = ({
  option,
  isSelected,
  sortOrder,
  onSelect,
  onToggleOrder,
}: SortOptionItemProps) => (
  <DropdownMenuCheckboxItem
    checked={isSelected}
    onCheckedChange={() => onSelect(option)}
    onSelect={(e) => e.preventDefault()}
    className="flex items-center justify-between"
  >
    <div className="flex items-center">
      {getOptionIcon(option)}
      <span>{option}</span>
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggleOrder(option);
      }}
      className="ml-2 rounded p-1 hover:bg-zinc-600"
    >
      {sortOrder === 'asc' ? (
        <SortAscIcon className="h-4 w-4" />
      ) : (
        <SortDescIcon className="h-4 w-4" />
      )}
    </button>
  </DropdownMenuCheckboxItem>
);

const SortingDropdown = ({
  onSortChange,
  currentOption = 'Trend',
  currentOrder = 'desc',
}: SortingDropdownProps) => {
  const [selectedOption, setSelectedOption] =
    useState<SortOption>(currentOption);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sortOrders, setSortOrders] = useState<Record<SortOption, SortOrder>>({
    Trend: currentOrder,
    Latest: currentOrder,
    Rating: currentOrder,
  });

  // Update state when props change (URL changes)
  React.useEffect(() => {
    setSelectedOption(currentOption);
    setSortOrders((prev) => ({
      ...prev,
      [currentOption]: currentOrder,
    }));
  }, [currentOption, currentOrder]);

  const handleOptionSelect = (option: SortOption) => {
    setSelectedOption(option);
    onSortChange?.(option, sortOrders[option]);
  };

  const handleToggleOrder = (option: SortOption) => {
    const newOrder: SortOrder = sortOrders[option] === 'asc' ? 'desc' : 'asc';

    setSortOrders((prev) => ({
      ...prev,
      [option]: newOrder,
    }));

    // If this is the currently selected option, notify parent of the change
    if (option === selectedOption) {
      onSortChange?.(option, newOrder);
    }
  };

  const currentSortOrder = sortOrders[selectedOption];

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button className="w-24">
          {currentSortOrder === 'asc' ? <SortAscIcon /> : <SortDescIcon />}
          <span>{selectedOption}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mt-2 w-56">
        <DropdownMenuLabel>Sorting Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SORT_OPTIONS.map((option) => (
          <SortOptionItem
            key={option}
            option={option}
            isSelected={selectedOption === option}
            sortOrder={sortOrders[option]}
            onSelect={handleOptionSelect}
            onToggleOrder={handleToggleOrder}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SortingDropdown;
