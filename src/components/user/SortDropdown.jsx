import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, SortAsc } from "lucide-react";

export default function SortDropdown({ options, selectedValue, onChange, label = "Sort" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const getCurrentLabel = () => {
    const current = options.find((opt) => opt.value === selectedValue);
    return current ? current.label : "Select";
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value) => {
    onChange(value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-1 sm:px-4 py-1.5 sm:py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:min-w-[160px]"
      >
        <SortAsc className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
        <span className="flex-1 text-left text-xs sm:text-sm">{getCurrentLabel()}</span>
        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
            </div>

            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors duration-150 flex items-start gap-3 ${
                  selectedValue === option.value ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {selectedValue === option.value ? <Check className="w-4 h-4 text-blue-600" /> : <div className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${selectedValue === option.value ? "text-blue-900" : "text-gray-900"}`}>
                    {option.label}
                  </div>
                  {option.description && <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
