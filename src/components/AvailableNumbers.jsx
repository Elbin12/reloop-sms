"use client"

import { useEffect, useState } from "react"
import {
  Search,
  Phone,
  MapPin,
  DollarSign,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  ShoppingCart,
  Filter,
} from "lucide-react"
import { useGetAvailableNumbersQuery } from "../store/api/dashboardApi"
import { useDebounce } from "../custom_hooks/useDebounce"

// Shimmer/Skeleton Components
const Shimmer = ({ className = "" }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded ${className}`} />
)

const NumberCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <Shimmer className="h-6 w-32" />
      <Shimmer className="h-6 w-16 rounded-full" />
    </div>
    <div className="space-y-2 mb-3">
      <div className="flex items-center space-x-2">
        <Shimmer className="w-4 h-4 rounded" />
        <Shimmer className="h-4 w-24" />
      </div>
      <div className="flex items-center space-x-2">
        <Shimmer className="w-4 h-4 rounded" />
        <Shimmer className="h-4 w-32" />
      </div>
    </div>
    <Shimmer className="h-10 w-full rounded-lg" />
  </div>
)

const SummaryCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <Shimmer className="h-4 w-20 mb-2" />
        <Shimmer className="h-8 w-16" />
      </div>
      <Shimmer className="w-8 h-8 rounded" />
    </div>
  </div>
)

const AvailableNumbers = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [labelFilter, setLabelFilter] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("price_asc");

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const {
    data: numbersData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetAvailableNumbersQuery({ 
    page: currentPage,
    search: debouncedSearchTerm,
    label: labelFilter,
    price_min: priceMin,
    price_max: priceMax,
    sort_by: sortBy,
  })

  const availableNumbers = numbersData?.results || []
  const registeredNumbers = numbersData?.registered?.results || []
  const ownedNumbers = numbersData?.owned?.results || []
  
  const availableCount = numbersData?.count || 0
  const registeredCount = numbersData?.registered?.count || 0
  const ownedCount = numbersData?.owned?.count || 0

  const nextPage = numbersData?.next
  const previousPage = numbersData?.previous

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm])

  const handleRefresh = () => {
    refetch()
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    // setCurrentPage(1)
  }

  const handlePurchase = (number) => {
    console.log("Purchasing number:", number)
    // Implement purchase logic here
  }

  const formatPhoneNumber = (number) => {
    // Format: +61 430 251 793
    if (!number) return ""
    const cleaned = number.replace(/\D/g, "")
    if (cleaned.length === 11) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
    }
    return number
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Available Numbers</h1>
          <p className="text-gray-600 mt-2">
            Browse and manage available phone numbers
          </p>
        </div>
        {/* <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button> */}
      </div>

      {/* Summary Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </>
        ) : (
          <>
            <SummaryCard
              title="Available"
              value={availableCount}
              icon={<Phone className="w-8 h-8 text-green-500" />}
              color="green"
            />
            <SummaryCard
              title="Registered"
              value={registeredCount}
              icon={<ShoppingCart className="w-8 h-8 text-blue-500" />}
              color="blue"
            />
            <SummaryCard
              title="Owned"
              value={ownedCount}
              icon={<Phone className="w-8 h-8 text-purple-500" />}
              color="purple"
            />
          </>
        )}
      </div> */}

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col gap-3 w-full">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by phone number..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full">
              {/* Min / Max Price */}
              <input
                type="number"
                placeholder="Min Price"
                value={priceMin}
                onChange={(e) => {
                  setPriceMin(e.target.value);
                  setPage(1);
                }}
                className="flex-1 min-w-[130px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Max Price"
                value={priceMax}
                onChange={(e) => {
                  setPriceMax(e.target.value);
                  setPage(1);
                }}
                className="flex-1 min-w-[130px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Dropdowns */}
              <select
                value={labelFilter}
                onChange={(e) => {
                  setLabelFilter(e.target.value);
                  setPage(1);
                }}
                className="flex-1 min-w-[140px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All Types</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="flex-1 min-w-[160px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Numbers Grid */}
        <div className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <NumberCardSkeleton key={i} />
              ))}
            </div>
          ) : availableNumbers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {availableNumbers.map((number) => (
                <NumberCard
                  key={number.id}
                  number={number}
                  onPurchase={handlePurchase}
                  formatPhoneNumber={formatPhoneNumber}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Phone className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">No numbers found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && availableNumbers.length > 0 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!previousPage}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!nextPage}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{currentPage}</span> of{" "}
                    <span className="font-medium">{availableCount}</span> numbers
                  </p>
                </div>

                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!previousPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {currentPage}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!nextPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shimmer Animation CSS */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// Summary Card Component
const SummaryCard = ({ title, value, icon, color = "blue" }) => {
  const colorClasses = {
    green: "bg-green-50 border-green-200",
    blue: "bg-blue-50 border-blue-200",
    purple: "bg-purple-50 border-purple-200",
  }

  return (
    <div className={`rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  )
}

// Number Card Component
const NumberCard = ({ number, onPurchase, formatPhoneNumber }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-semibold text-gray-900">{formatPhoneNumber(number.number)}</h3>
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        {number.label}
      </span>
    </div>

    <div className="space-y-2 mb-4">
      <div className="flex items-center text-sm text-gray-600">
        <DollarSign className="w-4 h-4" />
        <span className="text-lg">{number.price}</span>
      </div>

      {number.last_synced_at && (
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Last synced: {new Date(number.last_synced_at).toLocaleDateString()}</span>
        </div>
      )}
    </div>

    {/* <button
      onClick={() => onPurchase(number)}
      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      <ShoppingCart className="w-4 h-4" />
      <span>Purchase</span>
    </button> */}
  </div>
)

export default AvailableNumbers