import { X } from "lucide-react";

export function FilterInput({ type, label, icon: Icon, value, onChange, placeholder }) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
        {Icon && <Icon className="w-3 h-3 text-gray-500" />}
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white placeholder-gray-400 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}