//src\components\shared\SearchFilter.tsx
//كومبوننت جاهز
// بحث + فلترة
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SearchFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  filterValue?: string;
  filterOptions?: { value: string; label: string }[];
  onFilterChange?: (value: string) => void;
  filterPlaceholder?: string;
  showFilter?: boolean;
}

export function SearchFilter({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  filterValue,
  filterOptions = [],
  onFilterChange,
  filterPlaceholder = 'كل الحالات',
  showFilter = true,
}: SearchFilterProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      <div className="relative group flex-1">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-indigo-600" />
        <Input
          placeholder="بحث..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit?.()}
          className="h-12 pr-12 rounded-xl bg-card border-border font-medium shadow-sm focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {showFilter && filterOptions.length > 0 && (
        <div className="w-full md:w-72">
          <Select value={filterValue} onValueChange={(v) => onFilterChange?.(v)}>
            <SelectTrigger className="h-12 rounded-xl bg-card border-border font-medium px-4 gap-2 shadow-sm focus:ring-2 focus:ring-indigo-500/20">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-indigo-600" />
                <SelectValue placeholder={filterPlaceholder} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filterPlaceholder}</SelectItem>
              {filterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {onSearchSubmit && (
        <Button onClick={onSearchSubmit} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl h-12 px-6">
          بحث
        </Button>
      )}
    </div>
  );
}