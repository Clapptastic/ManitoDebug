import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Building2, Globe, Tag } from 'lucide-react';
import { searchSuggestionsService, SearchSuggestion } from '@/services/searchSuggestionsService';
import { cn } from '@/lib/utils';

interface SearchWithSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
}

interface SuggestionsData {
  companies: SearchSuggestion[];
  industries: string[];
  domains: string[];
}

export const SearchWithSuggestions: React.FC<SearchWithSuggestionsProps> = ({
  value,
  onChange,
  placeholder = "Search companies, domains, or industries...",
  className,
  showSuggestions = true
}) => {
  const [suggestions, setSuggestions] = useState<SuggestionsData>({
    companies: [],
    industries: [],
    domains: []
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search effect
  useEffect(() => {
    if (!showSuggestions || !value || value.length < 2) {
      setSuggestions({ companies: [], industries: [], domains: [] });
      setShowDropdown(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const companies = await searchSuggestionsService.getCompanySuggestions(value);
        setSuggestions({
          companies: companies || [],
          industries: [],
          domains: []
        });
        setShowDropdown(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions({ companies: [], industries: [], domains: [] });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, showSuggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate total suggestions for keyboard navigation
  const totalSuggestions = suggestions.companies.length + suggestions.industries.length + suggestions.domains.length;

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || totalSuggestions === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalSuggestions);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalSuggestions) % totalSuggestions);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const allSuggestions = [
            ...suggestions.companies.map(c => c.company_name),
            ...suggestions.industries,
            ...suggestions.domains
          ];
          onChange(allSuggestions[selectedIndex]);
          setShowDropdown(false);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const renderSuggestionItem = (text: string, icon: React.ReactNode, index: number, type: string) => {
    const isSelected = index === selectedIndex;
    return (
      <div
        key={`${type}-${index}`}
        className={cn(
          "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
          isSelected ? "bg-muted" : "hover:bg-muted/50"
        )}
        onClick={() => handleSuggestionClick(text)}
      >
        {icon}
        <span className="text-sm">{text}</span>
      </div>
    );
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.companies.length > 0 || suggestions.industries.length > 0 || suggestions.domains.length > 0) {
              setShowDropdown(true);
            }
          }}
          className="pl-8"
        />
      </div>

      {showDropdown && showSuggestions && (
        <Card ref={dropdownRef} className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Loading suggestions...
            </div>
          ) : (
            <>
              {suggestions.companies.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                    Companies
                  </div>
                  {suggestions.companies.map((company, index) =>
                    renderSuggestionItem(
                      company.company_name,
                      <Building2 className="h-4 w-4 text-muted-foreground" />,
                      index,
                      'company'
                    )
                  )}
                </div>
              )}

              {suggestions.industries.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                    Industries
                  </div>
                  {suggestions.industries.map((industry, index) =>
                    renderSuggestionItem(
                      industry,
                      <Tag className="h-4 w-4 text-muted-foreground" />,
                      suggestions.companies.length + index,
                      'industry'
                    )
                  )}
                </div>
              )}

              {suggestions.domains.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                    Domains
                  </div>
                  {suggestions.domains.map((domain, index) =>
                    renderSuggestionItem(
                      domain,
                      <Globe className="h-4 w-4 text-muted-foreground" />,
                      suggestions.companies.length + suggestions.industries.length + index,
                      'domain'
                    )
                  )}
                </div>
              )}

              {totalSuggestions === 0 && (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  No suggestions found
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
};