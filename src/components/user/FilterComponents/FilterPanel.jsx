import React from 'react';
import { X } from 'lucide-react';

export default function FilterPanel({ title, activeCount, onClear, children }) {
  return (
    <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg mb-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{title}</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {activeCount} active
            </span>
          )}
        </div>
        <button
          onClick={onClear}
          className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
            activeCount > 0
              ? 'text-gray-600 hover:text-gray-800 border border-gray-300 hover:bg-gray-50'
              : 'text-gray-400 border border-gray-200'
          }`}
        >
          <X className="w-3 h-3" />
          Clear All
        </button>
      </div>

      {/* Content */}
      <div className="p-4">{children}</div>
    </div>
  );
}
