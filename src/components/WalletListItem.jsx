import { ChevronDown, ChevronUp, ExternalLink, MessageSquare, Plus } from "lucide-react"
import { useGetTransactionsQuery } from "../store/api/walletApi"

export const WalletListItem = ({
  wallet,
  currentPage,
  expanded,
  onPageChange,
  toggleAccountExpansion,
  onAddFunds,
  getBalanceStatus,
  getTransactionIcon,
}) => {
  const {
    data: txData,
    isLoading: txLoading,
    isFetching: txFetching,
    error: txError,
  } = useGetTransactionsQuery(
    { page: currentPage, per_page: 5, wallet: wallet.id },
    { skip: !expanded } // only fetch when expanded
  )

  const walletTransactions = txData?.results || []
  const totalTransactions = txData?.count || 0
  const totalPages = Math.ceil(totalTransactions / 5)
  const balanceStatus = getBalanceStatus(wallet.balance)

  // Transaction Card Component
    const TransactionCard = ({ transaction, getTransactionIcon }) => (
        <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-center space-x-3">
            <div
                className={`p-2 rounded-full ${
                transaction.transaction_type === "credit" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                }`}
            >
                {getTransactionIcon(transaction.description)}
            </div>

            <div>
                <div className="flex items-center space-x-2">
                <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    transaction.transaction_type === "credit" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                >
                    {transaction.transaction_type === "credit" ? "Credit" : "Debit"}
                </span>
                <span className="text-sm text-gray-500">{new Date(transaction.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{transaction.description}</p>
                {transaction.reference_id && (
                <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                    <ExternalLink className="w-3 h-3" />
                    <span>Ref: {transaction.reference_id}</span>
                </p>
                )}
            </div>
            </div>

            <div className="text-right">
            <div
                className={`text-sm font-semibold ${
                transaction.transaction_type === "credit" ? "text-green-600" : "text-red-600"
                }`}
            >
                {transaction.transaction_type === "credit" ? "+" : "-"}${transaction.amount}
            </div>
            <div className="text-xs text-gray-500">Balance: ${transaction.balance_after}</div>
            </div>
        </div>
    )

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => toggleAccountExpansion(wallet.id)}
              className="flex items-center space-x-2 text-left"
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{wallet.location_name}</h3>
                <p className="text-sm text-gray-500">
                  {wallet.account_user_id} • {wallet.business_email}
                </p>
              </div>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">${wallet.balance}</div>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${balanceStatus.color}`}
              >
                {balanceStatus.status}
              </span>
            </div>

            <div className="text-right text-sm text-gray-500">
              <div>In: ${wallet.inbound_segment_charge}</div>
              <div>Out: ${wallet.outbound_segment_charge}</div>
            </div>

            <button
              onClick={() => onAddFunds(wallet)}
              className="flex items-center space-x-1 px-3 py-2 border border-indigo-400 text-indigo-700 rounded-lg hover:bg-indigo-50"
            >
              {/* <Plus className="w-4 h-4" /> */}
              <span>Manage Funds</span>
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <span>{wallet.total_transactions} total transactions</span>
          <span>Last updated: {new Date(wallet.updated_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Transactions */}
      {expanded && (
        <div className="p-4">
          {txLoading || txFetching ? (
            <div className="text-center py-8 text-gray-500">Loading transactions...</div>
          ) : txError ? (
            <div className="text-center py-8 text-red-500">Failed to load transactions</div>
          ) : walletTransactions.length > 0 ? (
            <>
              <div className="space-y-3 mb-4">
                {walletTransactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    getTransactionIcon={getTransactionIcon}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-700">
                    Showing {(currentPage - 1) * 5 + 1} to{" "}
                    {Math.min(currentPage * 5, totalTransactions)} of {totalTransactions} transactions
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onPageChange(wallet.id, Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => onPageChange(wallet.id, Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No transactions found for the selected filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}