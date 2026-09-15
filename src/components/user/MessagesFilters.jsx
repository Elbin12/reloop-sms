import React from "react";
import FilterPanel from "./FilterComponents/FilterPanel";
import { MessageSquare, ArrowLeftRight, Phone, Calendar, AlertCircle } from "lucide-react";
import { FilterSelect } from "./FilterComponents/FilterSelect";
import { FilterInput } from "./FilterComponents/FilterInput";
import { ERROR_CATEGORY_OPTIONS } from "./messageFilterConstants";

export default function MessagesFilters({ filters, onChange, onClear, variant = "advanced" }) {
  const activeCount = Object.values(filters).filter(Boolean).length;

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "delivered", label: "Delivered" },
    { value: "sent", label: "Sent" },
    { value: "queued", label: "Queued (low balance)" },
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Failed" },
  ];

  const reasonOptions = [
    { value: "", label: "All failure reasons" },
    ...ERROR_CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  ];

  if (variant === "primary") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <FilterSelect
          label="Status"
          icon={MessageSquare}
          value={filters.status}
          onChange={(val) => onChange("status", val)}
          options={statusOptions}
        />
        <FilterSelect
          label="Direction"
          icon={ArrowLeftRight}
          value={filters.direction}
          onChange={(val) => onChange("direction", val)}
          options={[
            { value: "", label: "All Directions" },
            { value: "inbound", label: "Inbound" },
            { value: "outbound", label: "Outbound" },
          ]}
        />
        <FilterSelect
          label="Failure reason"
          icon={AlertCircle}
          value={filters.error_category}
          onChange={(val) => onChange("error_category", val)}
          options={reasonOptions}
        />
      </div>
    );
  }

  return (
    <FilterPanel title="More filters" activeCount={activeCount} onClear={onClear}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FilterInput
          type="text"
          label="From Number"
          icon={Phone}
          value={filters.from_number}
          onChange={(val) => onChange("from_number", val)}
          placeholder="e.g., +61412345678"
        />

        <FilterInput
          type="text"
          label="To Number"
          icon={Phone}
          value={filters.to_number}
          onChange={(val) => onChange("to_number", val)}
          placeholder="e.g., +61412345678"
        />

        <FilterInput
          type="date"
          label="Created from"
          icon={Calendar}
          value={filters.created_at__gte}
          onChange={(val) => onChange("created_at__gte", val)}
        />

        <FilterInput
          type="date"
          label="Created to"
          icon={Calendar}
          value={filters.created_at__lte}
          onChange={(val) => onChange("created_at__lte", val)}
        />

        <FilterInput
          type="date"
          label="Sent from"
          icon={Calendar}
          value={filters.sent_at__gte}
          onChange={(val) => onChange("sent_at__gte", val)}
        />

        <FilterInput
          type="date"
          label="Sent to"
          icon={Calendar}
          value={filters.sent_at__lte}
          onChange={(val) => onChange("sent_at__lte", val)}
        />
      </div>
    </FilterPanel>
  );
}
