import React from "react";
import FilterPanel from "./FilterComponents/FilterPanel";
import { MessageSquare, ArrowLeftRight, Phone, Calendar } from "lucide-react";
import { FilterSelect } from "./FilterComponents/FilterSelect";
import { FilterInput } from "./FilterComponents/FilterInput";

export default function MessagesFilters({ filters, onChange, onClear }) {
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <FilterPanel title="Filters" activeCount={activeCount} onClear={onClear}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FilterSelect
          label="Status"
          icon={MessageSquare}
          value={filters.status}
          onChange={(val) => onChange("status", val)}
          options={[
            { value: "", label: "All Statuses" },
            { value: "delivered", label: "Delivered" },
            { value: "failed", label: "Failed" },
            { value: "pending", label: "Pending" },
          ]}
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

        <FilterInput
          type="text"
          label="From Number"
          icon={Phone}
          value={filters.from_number}
          onChange={(val) => onChange("from_number", val)}
          placeholder="e.g., +1234567890"
        />

        <FilterInput
          type="text"
          label="To Number"
          icon={Phone}
          value={filters.to_number}
          onChange={(val) => onChange("to_number", val)}
          placeholder="e.g., +1234567890"
        />

        {/* Date filters */}
        <FilterInput
          type="date"
          label="From Date"
          icon={Calendar}
          value={filters.sent_at__gte}
          onChange={(val) => onChange("sent_at__gte", val)}
          placeholder="YYYY-MM-DD"
        />

        <FilterInput
          type="date"
          label="To Date"
          icon={Calendar}
          value={filters.sent_at__lte}
          onChange={(val) => onChange("sent_at__lte", val)}
          placeholder="YYYY-MM-DD"
        />
      </div>
    </FilterPanel>
  );
}
