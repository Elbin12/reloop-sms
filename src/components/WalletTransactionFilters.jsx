import { Calendar, ArrowLeftRight } from "lucide-react";

const DATE_PRESETS = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "week", label: "Last 7 days" },
  { id: "month", label: "Last 30 days" },
];

function toDateInputValue(date) {
  return date.toISOString().split("T")[0];
}

export function getDateRangeForPreset(preset) {
  const now = new Date();
  if (preset === "all") {
    return { start_date: "", end_date: "" };
  }
  if (preset === "today") {
    return { start_date: toDateInputValue(now), end_date: toDateInputValue(now) };
  }
  if (preset === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return { start_date: toDateInputValue(start), end_date: toDateInputValue(now) };
  }
  if (preset === "month") {
    const start = new Date(now);
    start.setMonth(now.getMonth() - 1);
    return { start_date: toDateInputValue(start), end_date: toDateInputValue(now) };
  }
  return { start_date: "", end_date: "" };
}

export default function WalletTransactionFilters({ filters, onChange, onClear, datePreset, onDatePresetChange }) {
  const activeCount = [
    filters.transaction_type,
    filters.start_date,
    filters.end_date,
    filters.ordering !== "-created_at" ? filters.ordering : "",
  ].filter(Boolean).length;

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">Filter transactions</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {activeCount} active
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-gray-600 hover:text-gray-900"
        >
          Clear all
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onDatePresetChange(preset.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              datePreset === preset.id
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <label className="flex items-center gap-1 text-xs font-medium text-gray-700">
            <ArrowLeftRight className="h-3 w-3 text-gray-500" />
            Type
          </label>
          <select
            value={filters.transaction_type}
            onChange={(e) => onChange("transaction_type", e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All types</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="flex items-center gap-1 text-xs font-medium text-gray-700">
            <Calendar className="h-3 w-3 text-gray-500" />
            From date
          </label>
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => onChange("start_date", e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="flex items-center gap-1 text-xs font-medium text-gray-700">
            <Calendar className="h-3 w-3 text-gray-500" />
            To date
          </label>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => onChange("end_date", e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Sort by</label>
          <select
            value={filters.ordering}
            onChange={(e) => onChange("ordering", e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="-created_at">Newest first</option>
            <option value="created_at">Oldest first</option>
            <option value="-amount">Highest amount</option>
            <option value="amount">Lowest amount</option>
          </select>
        </div>
      </div>
    </div>
  );
}
