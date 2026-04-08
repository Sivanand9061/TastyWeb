import React, { useEffect, useState, useRef } from 'react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  error?: string;
  onBlur?: () => void;
}

export default function AddressAutocomplete({ value, onChange, error, onBlur }: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync external value changes (e.g. from user profile)
  useEffect(() => {
    if (value && value !== inputValue && !suggestions.length) {
      setInputValue(value);
    }
  }, [value, inputValue, suggestions.length]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      // Using OpenStreetMap's Nominatim public API. Searching exclusively in the UAE (ae).
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=ae&limit=5`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setSuggestions(data);
    } catch (e) {
      console.error("Failed to fetch address", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val); // Update parent form immediately
    setIsDropdownVisible(true);
    
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 600); // 600ms debounce
  };

  const handleSelect = (suggestion: any) => {
    setInputValue(suggestion.display_name);
    setSuggestions([]);
    setIsDropdownVisible(false);
    
    // Pass the selected address and coordinates back up
    onChange(suggestion.display_name, parseFloat(suggestion.lat), parseFloat(suggestion.lon));
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => {
          if (inputValue.length >= 3) setIsDropdownVisible(true);
        }}
        onBlur={onBlur}
        placeholder="Search for an area or street (e.g., Al Rawda, Ajman)"
        className={`w-full px-4 py-3 border rounded-[22px] text-[14px] placeholder:text-[#ccc] focus:outline-none transition-colors ${
          error ? "border-[#d90429] focus:border-[#d90429]" : "border-[#d1d1d1] focus:border-[#f51c27]"
        }`}
      />
      
      {isLoading && (
        <div className="absolute right-4 top-3.5">
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Autocomplete dropdown */}
      {isDropdownVisible && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-[#e0e0e0] mt-1 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <li 
              key={suggestion.place_id || index} 
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
            >
              <div className="font-bold text-gray-900 truncate">
                {suggestion.display_name.split(',')[0]}
              </div>
              <div className="text-gray-500 text-[12px] truncate">
                {suggestion.display_name.split(',').slice(1).join(',')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
