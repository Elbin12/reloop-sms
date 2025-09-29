import React from "react";
import FilterPanel from "./FilterComponents/FilterPanel";
import { MessageSquare, ArrowLeftRight, Phone, Calendar } from "lucide-react";
import { FilterSelect } from "./FilterComponents/FilterSelect";
import { FilterInput } from "./FilterComponents/FilterInput";

export default function TransactionsFilters({ filters, onChange, onClear }) {
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <FilterPanel title="Filters" activeCount={activeCount} onClear={onClear}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FilterSelect
          label="Transaction Type"
          icon={MessageSquare}
          value={filters.transaction_type}
          onChange={(val) => onChange("transaction_type", val)}
          options={[
            { value: "", label: "All Types" },
            { value: "credit", label: "Credit" },
            { value: "failed", label: "Failed" },
            { value: "debit", label: "Debit" },
          ]}
        />

        <FilterInput
          type="number"
          label="Min Amount"
          icon={ArrowLeftRight}
          value={filters.min_amount}
          onChange={(val) => onChange("min_amount", val)}
          placeholder="0.00"
        />

        <FilterInput
          type="number"
          label="Max Amount"
          icon={Phone}
          value={filters.max_amount}
          onChange={(val) => onChange("max_amount", val)}
          placeholder="0.00"
        />

        {/* Date filters */}
        <FilterInput
          type="date"
          label="From Date"
          icon={Calendar}
          value={filters.created_at__gte}
          onChange={(val) => onChange("created_at__gte", val)}
          placeholder="YYYY-MM-DD"
        />

        <FilterInput
          type="date"
          label="To Date"
          icon={Calendar}
          value={filters.created_at__lte}
          onChange={(val) => onChange("created_at__lte", val)}
          placeholder="YYYY-MM-DD"
        />
      </div>
    </FilterPanel>
  );
}