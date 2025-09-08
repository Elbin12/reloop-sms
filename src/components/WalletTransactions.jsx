"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Search,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  Plus,
  X,
  Calendar,
  CreditCard,
  MessageSquare,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Grid3X3,
  List,
} from "lucide-react"
import { useGetTransactionsQuery, useGetWalletsQuery, useGetWalletSummaryQuery } from "../store/api/walletApi"
import { WalletListItem } from "./WalletListItem"

const useDebounce = (value, delay) => value

// Shimmer/Skeleton Components
const Shimmer = ({ className = "" }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded ${className}`} />
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

const WalletCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Shimmer className="h-6 w-32 mb-2" />
          <Shimmer className="h-4 w-40 mb-1" />
          <Shimmer className="h-3 w-24" />
        </div>
        <Shimmer className="h-6 w-16 rounded-full" />
      </div>

      {/* Balance */}
      <div className="mb-4">
        <Shimmer className="h-10 w-24 mb-2" />
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-16" />
          <Shimmer className="h-4 w-16" />
        </div>
      </div>

      {/* Transactions */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <Shimmer className="h-4 w-32" />
          <Shimmer className="h-3 w-12" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Shimmer className="w-8 h-8 rounded" />
                <div className="flex-1">
                  <Shimmer className="h-3 w-24 mb-1" />
                  <Shimmer className="h-3 w-16" />
                </div>
              </div>
              <Shimmer className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

const WalletListItemSkeleton = () => (
  <div className="border border-gray-200 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4 flex-1">
        <div>
          <Shimmer className="h-6 w-32 mb-2" />
          <Shimmer className="h-4 w-40 mb-1" />
          <Shimmer className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <Shimmer className="h-8 w-20 mb-1" />
          <Shimmer className="h-4 w-16" />
        </div>
        <Shimmer className="h-6 w-16 rounded-full" />
        <Shimmer className="w-8 h-8 rounded" />
      </div>
    </div>
  </div>
)

const TransactionItemSkeleton = () => (
  <div className="border border-gray-200 rounded-lg p-4">
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-3 flex-1">
        <Shimmer className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Shimmer className="h-5 w-32" />
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-5 w-16 rounded-full" />
          </div>
          <Shimmer className="h-4 w-64 mb-2" />
          <div className="flex items-center space-x-4">
            <Shimmer className="h-3 w-32" />
            <Shimmer className="h-3 w-24" />
          </div>
        </div>
      </div>
      <div className="text-right">
        <Shimmer className="h-6 w-16 mb-1" />
        <Shimmer className="h-4 w-20" />
      </div>
    </div>
  </div>
)

const WalletTransactions = () => {
  const [activeTab, setActiveTab] = useState("accounts")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedWalletId, setSelectedWalletId] = useState(null)
  const [showAddFundsModal, setShowAddFundsModal] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [addFundsAmount, setAddFundsAmount] = useState("")
  const [expandedAccounts, setExpandedAccounts] = useState(new Set())
  const [dateFilter, setDateFilter] = useState("all")
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all")
  const [balanceFilter, setBalanceFilter] = useState("all")
  const [sortBy, setSortBy] = useState("updated_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [viewMode, setViewMode] = useState("grid") // grid or list

  // Pagination states
  const [accountsPage, setAccountsPage] = useState(1)
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [accountsPerPage, setAccountsPerPage] = useState(12)
  const [transactionsPerPage, setTransactionsPerPage] = useState(25)

  // Loading states
  const [walletsLoadingState, setWalletsLoadingState] = useState(false)
  const [isRefreshingState, setIsRefreshingState] = useState(false)

  const debouncedSearch = useDebounce(searchTerm, 500)

  // Build query parameters for wallets
  const buildWalletsQueryParams = () => {
    const params = new URLSearchParams()
    
    params.set('page', accountsPage.toString())
    params.set('per_page', accountsPerPage.toString())
    
    // Search
    if (debouncedSearch) {
      params.set('search', debouncedSearch)
    }
    
    // Balance filter
    if (balanceFilter === "high") {
      params.set('balance_min', '50')
    } else if (balanceFilter === "medium") {
      params.set('balance_min', '10')
      params.set('balance_max', '50')
    } else if (balanceFilter === "low") {
      params.set('balance_max', '10')
    }
    
    // Sorting
    const orderingValue = sortOrder === "desc" ? `-${sortBy}` : sortBy
    params.set('ordering', orderingValue)
    
    return params
  }

  // Build query parameters for transactions
  const buildTransactionsQueryParams = () => {
    const params = new URLSearchParams()
    
    params.set('page', transactionsPage.toString())
    params.set('per_page', transactionsPerPage.toString())
    
    // Search with debounce
    if (debouncedSearch) {
      params.set("search", debouncedSearch)
    }
    
    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      let startDate, endDate
      
      switch (dateFilter) {
        case "today":
          startDate = new Date()
          startDate.setHours(0, 0, 0, 0)

          endDate = new Date()
          endDate.setHours(23, 59, 59, 999)

          params.set("start_date", startDate.toISOString().split("T")[0])
          params.set("end_date", endDate.toISOString().split("T")[0])
          break
        case "week":
          startDate = new Date()
          startDate.setDate(now.getDate() - 7)
          params.set('start_date', startDate.toISOString().split('T')[0])
          break
        case "month":
          startDate = new Date()
          startDate.setMonth(now.getMonth() - 1)
          params.set('start_date', startDate.toISOString().split('T')[0])
          break
      }
    }
    
    // Transaction type filter
    if (transactionTypeFilter !== "all") {
      params.set('transaction_type', transactionTypeFilter)
    }
    
    return params
  }

  const {
    data: walletsData,
    isLoading: walletsLoading,
    isFetching: walletsFetching,
    error: walletsError,
  } = useGetWalletsQuery(Object.fromEntries(buildWalletsQueryParams()), {skip:false})

  const {
    data: txData,
    isLoading: txLoading,
    isFetching: txFetching,
    error: txError,
  } = useGetTransactionsQuery(
    Object.fromEntries(buildTransactionsQueryParams(), {skip:false}), 
    { skip: activeTab !== "transactions" }
  )

  const {
    data: walletSummary,
    isLoading: walletSummaryLoading,
    isFetching: walletSummaryFetching,
    error: WalletSummaryError,
  } = useGetWalletSummaryQuery()
  

  const isLoading = walletsLoading || (activeTab === "transactions" && txLoading)
  const isRefreshing = walletsFetching || (activeTab === "transactions" && txFetching)

  
  // Group transactions by wallet for account view
  const getWalletTransactions = useCallback(
    (walletId, page = 1, limit = 10) => {
      const wallet = walletsData?.results?.find(w => w.id === walletId)
      if (!wallet || !Array.isArray(wallet.transactions)) {
        return { transactions: [], total: 0, hasMore: false }
      }
      
      let walletTransactions = [...wallet.transactions]
      
      // Apply filters
      if (transactionTypeFilter !== "all") {
        walletTransactions = walletTransactions.filter((t) => t.transaction_type === transactionTypeFilter)
      }

      if (dateFilter !== "all") {
        const now = new Date()
        const filterDate = new Date()

        switch (dateFilter) {
          case "today":
            filterDate.setHours(0, 0, 0, 0)
            break
          case "week":
            filterDate.setDate(now.getDate() - 7)
            break
          case "month":
            filterDate.setMonth(now.getMonth() - 1)
            break
          default:
            break
        }

        if (dateFilter !== "all") {
          walletTransactions = walletTransactions.filter((t) => new Date(t.created_at) >= filterDate)
        }
      }

      // Sort by creation date (newest first)
      walletTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      // Apply pagination to wallet transactions
      const start = (page - 1) * limit
      const end = start + limit

      return {
        transactions: walletTransactions.slice(start, end),
        total: walletTransactions.length,
        hasMore: end < walletTransactions.length,
      }
    },
    [walletsData, transactionTypeFilter, dateFilter],
  )

  const handleRefresh = async () => {
    setIsRefreshingState(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshingState(false)
  }

  const handleAddFunds = (wallet) => {
    setSelectedWallet(wallet)
    setShowAddFundsModal(true)
  }

  const handleAddFundsSubmit = () => {
    console.log(`Adding ${addFundsAmount} to wallet ${selectedWallet.id}`)
    setShowAddFundsModal(false)
    setAddFundsAmount("")
    setSelectedWallet(null)
  }

  const toggleAccountExpansion = (walletId) => {
    const newExpanded = new Set(expandedAccounts)
    if (newExpanded.has(walletId)) {
      newExpanded.delete(walletId)
    } else {
      newExpanded.add(walletId)
    }
    setExpandedAccounts(newExpanded)
  }

  const getBalanceStatus = (balance) => {
    const balanceNum = Number.parseFloat(balance ?? "0")
    if (balanceNum > 50) return { status: "Good", color: "bg-green-100 text-green-800" }
    if (balanceNum > 10) return { status: "Low", color: "bg-yellow-100 text-yellow-800" }
    return { status: "Critical", color: "bg-red-100 text-red-800" }
  }

  const getTransactionIcon = (description) => {
    if (description.includes("SMS")) return <MessageSquare className="w-4 h-4" />
    if (description.includes("Stripe") || description.includes("payment")) return <CreditCard className="w-4 h-4" />
    return <DollarSign className="w-4 h-4" />
  }

  const handleExportData = () => {
    const dataToExport = activeTab === "accounts" ? walletsData?.results : txData?.results
    console.log("Exporting data:", dataToExport)
    // Implement CSV/Excel export logic here
  }

  // Handle filter changes
  const handleBalanceFilter = (value) => {
    setBalanceFilter(value)
    setAccountsPage(1) // Reset to first page
  }

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(newSortBy)
      setSortOrder("desc")
    }
    setAccountsPage(1) // Reset to first page
  }

  const handleSearchChange = (value) => {
    setSearchTerm(value)
    setAccountsPage(1) // Reset to first page
    setTransactionsPage(1) // Reset to first page
  }

  const handleDateFilterChange = (value) => {
    setDateFilter(value)
    setTransactionsPage(1) // Reset to first page
  }

  const handleTransactionTypeFilterChange = (value) => {
    setTransactionTypeFilter(value)
    setTransactionsPage(1) // Reset to first page
  }

  // Calculate pagination info
  const accountsTotalCount = walletsData?.count ?? walletSummary?.total_accounts
  const totalAccountsPages = Math.max(1, Math.ceil(accountsTotalCount / accountsPerPage))

  const transactionsTotalCount = txData?.count ?? txData?.results?.length
  const totalTransactionsPages = Math.max(1, Math.ceil(transactionsTotalCount / transactionsPerPage))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wallet & Transactions</h1>
          <p className="text-gray-600 mt-2">
            Manage wallet balances and view detailed transaction history
            {isLoading && <span className="ml-2 text-blue-600">Loading...</span>}
          </p>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {isLoading ? (
          // Show skeleton cards while loading
          Array.from({ length: 6 }).map((_, i) => (
            <SummaryCardSkeleton key={i} />
          ))
        ) : (
          <>
            <SummaryCard
              title="Total Accounts"
              value={walletSummary?.total_accounts || 0}
              icon={<Wallet className="w-8 h-8 text-blue-500" />}
            />
            <SummaryCard
              title="Total Balance"
              value={`$${Number(walletSummary?.total_balance ?? 0).toFixed(2)}`}
              icon={<DollarSign className="w-8 h-8 text-green-500" />}
            />
            <SummaryCard
              title="Total Credits"
              value={`+$${Number(walletSummary?.total_credits ?? 0).toFixed(2)}`}
              icon={<TrendingUp className="w-8 h-8 text-green-500" />}
            />
            <SummaryCard
              title="Total Debits"
              value={`-$${Number(walletSummary?.total_debits ?? 0).toFixed(2)}`}
              icon={<TrendingDown className="w-8 h-8 text-red-500" />}
            />
            <SummaryCard
              title="Transactions"
              value={walletSummary?.total_transactions || 0}
              icon={<Calendar className="w-8 h-8 text-purple-500" />}
            />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => {
                setActiveTab("accounts")
                setAccountsPage(1)
              }}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "accounts"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Account View ({walletSummary?.total_accounts || 0})
            </button>
            <button
              onClick={() => {
                setActiveTab("transactions")
                setTransactionsPage(1)
              }}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "transactions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              All Transactions ({walletSummary?.total_transactions || 0})
            </button>
          </nav>
        </div>

        {/* Enhanced Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col space-y-4">
            {/* Search and View Mode */}
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by location name, user ID, email, or description..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {activeTab === "accounts" && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap gap-4">
              {activeTab === "accounts" && (
                <>
                  <select
                    value={balanceFilter}
                    onChange={(e) => handleBalanceFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Balances</option>
                    <option value="high">High ($50)</option>
                    <option value="medium">Medium ($10-$50)</option>
                    <option value="low">Low ($10)</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="updated_at">Sort by Last Updated</option>
                    <option value="balance">Sort by Balance</option>
                    <option value="location_name">Sort by Location</option>
                  </select>

                  <button
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <span>{sortOrder === "asc" ? "Ascending" : "Descending"}</span>
                    {sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <select
                    value={accountsPerPage}
                    onChange={(e) => {
                      setAccountsPerPage(Number(e.target.value))
                      setAccountsPage(1)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={6}>6 per page</option>
                    <option value={12}>12 per page</option>
                    <option value={24}>24 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </>
              )}

              {activeTab === "transactions" && (
                <>
                  <select
                    value={dateFilter}
                    onChange={(e) => handleDateFilterChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>

                  <select
                    value={transactionTypeFilter}
                    onChange={(e) => handleTransactionTypeFilterChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="credit">Credits Only</option>
                    <option value="debit">Debits Only</option>
                  </select>

                  <select
                    value={transactionsPerPage}
                    onChange={(e) => {
                      setTransactionsPerPage(Number(e.target.value))
                      setTransactionsPage(1)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content with Pagination */}
        <div className="p-6">
          {activeTab === "accounts" ? (
            <>
              {isLoading ? (
                <AccountTransactionViewSkeleton viewMode={viewMode} />
              ) : (
                <AccountTransactionView
                  wallets={walletsData?.results || []}
                  getWalletTransactions={getWalletTransactions}
                  expandedAccounts={expandedAccounts}
                  toggleAccountExpansion={toggleAccountExpansion}
                  onAddFunds={handleAddFunds}
                  getBalanceStatus={getBalanceStatus}
                  getTransactionIcon={getTransactionIcon}
                  viewMode={viewMode}
                />
              )}

              {/* Accounts Pagination */}
              {!isLoading && totalAccountsPages > 1 && (
                <PaginationControls
                  currentPage={accountsPage}
                  totalPages={totalAccountsPages}
                  onPageChange={setAccountsPage}
                  totalItems={accountsTotalCount}
                  itemsPerPage={accountsPerPage}
                  itemName="accounts"
                />
              )}
            </>
          ) : (
            <>
              {isLoading || (activeTab === "transactions" && txLoading) ? (
                <AllTransactionsViewSkeleton />
              ) : (
                <AllTransactionsView transactions={txData?.results || []} getTransactionIcon={getTransactionIcon} />
              )}

              {/* Transactions Pagination */}
              {!isLoading && !(activeTab === "transactions" && txLoading) && totalTransactionsPages > 1 && (
                <PaginationControls
                  currentPage={transactionsPage}
                  totalPages={totalTransactionsPages}
                  onPageChange={setTransactionsPage}
                  totalItems={transactionsTotalCount}
                  itemsPerPage={transactionsPerPage}
                  itemName="transactions"
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <AddFundsModal
          wallet={selectedWallet}
          amount={addFundsAmount}
          onAmountChange={setAddFundsAmount}
          onSubmit={handleAddFundsSubmit}
          onClose={() => {
            setShowAddFundsModal(false)
            setAddFundsAmount("")
            setSelectedWallet(null)
          }}
        />
      )}

      {/* Add Shimmer CSS */}
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

// Skeleton components for different views
const AccountTransactionViewSkeleton = ({ viewMode }) => {
  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <WalletListItemSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <WalletCardSkeleton key={i} />
      ))}
    </div>
  )
}

const AllTransactionsViewSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 8 }).map((_, i) => (
      <TransactionItemSkeleton key={i} />
    ))}
  </div>
)

// Pagination Controls Component
const PaginationControls = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, itemName }) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 7

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span>{" "}
            of <span className="font-medium">{totalItems}</span> {itemName}
          </p>
        </div>

        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    currentPage === page
                      ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ),
            )}

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}

// Reusable components
const SummaryCard = ({ title, value, icon, subtitle }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {icon}
    </div>
  </div>
)

const InputField = ({ label, type = "text", value, onChange, placeholder, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      {...props}
    />
  </div>
)

// Enhanced Account Transaction View Component
const AccountTransactionView = ({
  wallets,
  getWalletTransactions,
  expandedAccounts,
  toggleAccountExpansion,
  onAddFunds,
  getBalanceStatus,
  getTransactionIcon,
  viewMode = "grid",
}) => {
  const [walletTransactionPages, setWalletTransactionPages] = useState({})

  const handleWalletTransactionPageChange = (walletId, page) => {
    setWalletTransactionPages((prev) => ({
      ...prev,
      [walletId]: page,
    }))
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {wallets.map((wallet) => {
          const currentPage = walletTransactionPages[wallet.id] || 1
          const expanded = expandedAccounts.has(wallet.id)

          const formattedWallet = {
            id: wallet.id,
            account: {
              user_id: wallet.account_user_id,
              location_name: wallet.location_name,
              company_id: wallet.company_id,
              business_email: wallet.business_email || "",
            },
            balance: Number.parseFloat(wallet.balance ?? "0"),
            total_transactions: Number(wallet.total_transactions),
            inbound_segment_charge: Number.parseFloat(wallet.inbound_segment_charge ?? "0"),
            outbound_segment_charge: Number.parseFloat(wallet.outbound_segment_charge ?? "0"),
            updated_at: wallet.updated_at,
          }

          return (
            <WalletListItem
              key={wallet.id}
              wallet={formattedWallet}
              currentPage={currentPage}
              expanded={expanded}
              onPageChange={handleWalletTransactionPageChange}
              toggleAccountExpansion={toggleAccountExpansion}
              onAddFunds={onAddFunds}
              getBalanceStatus={getBalanceStatus}
              getTransactionIcon={getTransactionIcon}
            />
          )
        })}
      </div>
    )
  }

  // Grid view
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {wallets.map((wallet) => {
        const currentPage = walletTransactionPages[wallet.id] || 1
        const { transactions: walletTransactions, total: totalTransactions } = getWalletTransactions(
          wallet.id,
          currentPage,
          3,
        )
        const balanceStatus = getBalanceStatus(wallet.balance)

        const formattedWallet = {
          id: wallet.id,
          account: {
            user_id: wallet.account_user_id,
            location_name: wallet.location_name,
            company_id: wallet.company_id,
            business_email: wallet.business_email || "",
          },
          balance: Number.parseFloat(wallet.balance ?? "0"),
          total_transactions: Number(wallet.total_transactions),
          inbound_segment_charge: Number.parseFloat(wallet.inbound_segment_charge ?? "0"),
          outbound_segment_charge: Number.parseFloat(wallet.outbound_segment_charge ?? "0"),
          updated_at: wallet.updated_at,
        }

        return (
          <WalletCard
            key={wallet.id}
            wallet={formattedWallet}
            transactions={walletTransactions}
            totalTransactions={totalTransactions}
            balanceStatus={balanceStatus}
            onAddFunds={onAddFunds}
            getTransactionIcon={getTransactionIcon}
          />
        )
      })}
    </div>
  )
}

// Wallet Card Component for Grid View
const WalletCard = ({ wallet, transactions, totalTransactions, balanceStatus, onAddFunds, getTransactionIcon }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{wallet.account.location_name}</h3>
          <p className="text-sm text-gray-500 truncate">{wallet.account.business_email}</p>
          <p className="text-xs text-gray-400">{wallet.account.user_id}</p>
        </div>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${balanceStatus.color}`}>
          {balanceStatus.status}
        </span>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900">${wallet.balance.toFixed(2)}</div>
        <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
          <span>In: ${wallet.inbound_segment_charge.toFixed(3)}</span>
          <span>Out: ${wallet.outbound_segment_charge.toFixed(3)}</span>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">Recent Transactions</h4>
          <span className="text-xs text-gray-500">{wallet.total_transactions} total</span>
        </div>

        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.slice(0, 3).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div
                    className={`p-1 rounded ${
                      transaction.transaction_type === "credit"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {getTransactionIcon(transaction.description)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-600 truncate">{transaction.description}</p>
                    <p className="text-xs text-gray-400">{new Date(transaction.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div
                  className={`text-sm font-medium ${
                    transaction.transaction_type === "credit" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {transaction.transaction_type === "credit" ? "+" : "-"}${transaction.amount}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 text-center py-4">No recent transactions</p>
        )}
      </div>
    </div>
  </div>
)

// Enhanced All Transactions View Component
const AllTransactionsView = ({ transactions, getTransactionIcon }) => (
  <div className="space-y-3">
    {transactions.length > 0 ? (
      transactions.map((transaction) => (
        <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div
                className={`p-2 rounded-full ${
                  transaction.transaction_type === "credit" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                }`}
              >
                {getTransactionIcon(transaction.description)}
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900">{transaction.wallet?.location_name || 'N/A'}</h4>
                  <span className="text-sm text-gray-500">({transaction.wallet?.account_user_id || transaction.wallet?.account?.user_id || 'N/A'})</span>
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      transaction.transaction_type === "credit"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {transaction.transaction_type === "credit" ? "Credit" : "Debit"}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-2">{transaction.description}</p>

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>{new Date(transaction.created_at).toLocaleString()}</span>
                  {transaction.reference_id && (
                    <span className="flex items-center space-x-1">
                      <ExternalLink className="w-3 h-3" />
                      <span>Ref: {transaction.reference_id}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div
                className={`text-lg font-semibold ${
                  transaction.transaction_type === "credit" ? "text-green-600" : "text-red-600"
                }`}
              >
                {transaction.transaction_type === "credit" ? "+" : "-"}${transaction.amount}
              </div>
              <div className="text-sm text-gray-500">Balance: ${transaction.balance_after}</div>
            </div>
          </div>
        </div>
      ))
    ) : (
      <div className="text-center py-12 text-gray-500">
        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <h3 className="text-lg font-medium mb-2">No transactions found</h3>
        <p>Try adjusting your search terms or filters.</p>
      </div>
    )}
  </div>
)

// Add Funds Modal Component
const AddFundsModal = ({ wallet, amount, onAmountChange, onSubmit, onClose }) => {
  const predefinedAmounts = [10, 25, 50, 100, 250, 500]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add Funds</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700">{wallet.account.location_name}</div>
            <div className="text-sm text-gray-500">{wallet.account.business_email}</div>
            <div className="text-lg font-semibold text-gray-900 mt-2">
              Current Balance: ${wallet.balance.toFixed(2)}
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Amounts</label>
            <div className="grid grid-cols-3 gap-2">
              {predefinedAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => onAmountChange(quickAmount.toString())}
                  className={`px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 ${
                    amount === quickAmount.toString()
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-gray-300 text-gray-700"
                  }`}
                >
                  ${quickAmount}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <InputField
              label="Custom Amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="Enter custom amount"
            />
            {amount && Number.parseFloat(amount) > 0 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  New balance will be: ${(wallet.balance + Number.parseFloat(amount)).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!amount || Number.parseFloat(amount) <= 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add ${amount || "0"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default WalletTransactions