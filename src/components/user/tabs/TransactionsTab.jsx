import React, { useState } from 'react'
import SortDropdown from '../SortDropdown'
import TransactionsFilters from '../TransactionsFilter'
import { useGetTransactionsQuery } from '../../../store/api/userDashboardApi';
import { formatDistanceToNow } from 'date-fns';

const TransactionsTab = ({locationId}) => {
   const [transactionsPage, setTransactionsPage] = useState(1);
   const [transactionsFilters, setTransactionsFilters] = useState({
      transaction_type: "",
      created_at__gte: "",
      created_at__lte: "",
      min_amount: "",
      max_amount: "",
   });
   const [transactionsOrdering, setTransactionsOrdering] =
      useState("-created_at");
   
   const [showTransactionsFilters, setShowTransactionsFilters] = useState(false);

   const transactionsParams = {
      locationId,
      page: transactionsPage,
      ordering: transactionsOrdering,
      ...Object.fromEntries(
      Object.entries(transactionsFilters).filter(([_, v]) => v !== "")
      ),
   };
   const {
      data: transactions,
      isLoading: transactionsLoading,
      isFetching: transactionsFetching,
   } = useGetTransactionsQuery(transactionsParams, {
      refetchOnMountOrArgChange: true,
   });

   const handleTransactionSortChange = (value) => {
      setTransactionsOrdering(value);
      setIsOpen(false);
   };

   const handleTransactionsFilterChange = (field, value) => {
      setTransactionsFilters((prev) => ({ ...prev, [field]: value }));
   };

   const clearTransactionsFilters = () => {
      setTransactionsFilters({
         transaction_type: "",
         created_at__gte: "",
         created_at__lte: "",
         min_amount: "",
         max_amount: "",
      });
   };
  return (
	<div className="bg-white rounded-lg shadow-sm p-2 sm:p-4 border">
      <div className="flex justify-between items-center mb-4">
         <div className="flex items-center gap-2 sm:gap-9">
            <h3 className="font-semibold text-sm sm:text-xl">Transaction History</h3>
            <SortDropdown
            options={[
               {
               value: "-created_at",
               label: "Newest first",
               description: "Most recent transactions first",
               },
               {
               value: "created_at",
               label: "Oldest first",
               description: "Oldest transactions first",
               },
               {
               value: "-amount",
               label: "Highest amount",
               description: "Most expensive transactions first",
               },
               {
               value: "amount",
               label: "Lowest amount",
               description: "Least expensive transactions first",
               },
            ]}
            selectedValue={transactionsOrdering}
            onChange={handleTransactionSortChange}
            label="Sort transactions by"
            />
         </div>
         <div className="flex gap-2">
            <button
            onClick={() =>
               setShowTransactionsFilters(!showTransactionsFilters)
            }
            className="px-2 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
            {showTransactionsFilters ? "Hide Filters" : "Show Filters"}
            </button>
         </div>
         </div>

         {/* Transactions Filters */}
         {showTransactionsFilters && (
         <TransactionsFilters
            filters={transactionsFilters}
            onChange={handleTransactionsFilterChange}
            onClear={clearTransactionsFilters}
         />
         )}

         {transactionsFetching ? (
         <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
            <div
               key={i}
               className="p-4 border border-gray-200 rounded-lg flex justify-between items-center animate-pulse"
            >
               <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center"></div>
               <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                  <div className="flex gap-2">
                  <div className="h-3 bg-gray-300 rounded w-20"></div>
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                  </div>
               </div>
               </div>
               <div className="text-right space-y-2">
               <div className="h-4 bg-gray-300 rounded w-16 mx-auto"></div>
               <div className="h-3 bg-gray-300 rounded w-20 mx-auto"></div>
               </div>
            </div>
            ))}
         </div>
         ) : (
         <div className="space-y-4">
            {transactions?.results.map((t) => (
            <div
               key={t.id}
               className="p-4 border border-gray-200 rounded-lg flex justify-between items-center"
            >
               <div className="flex items-center gap-4">
               <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  t.transaction_type === "credit"
                     ? "bg-green-100"
                     : "bg-red-100"
                  }`}
               >
                  <span className="text-lg">
                  {t.transaction_type === "credit" ? "↗️" : "↘️"}
                  </span>
               </div>
               <div>
                  <p className="font-medium">{t.description}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                  <span>
                     {formatDistanceToNow(new Date(t.created_at), {
                     addSuffix: true,
                     })}
                  </span>
                  {t.reference_id && (
                     <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                     Ref: {t.reference_id.slice(0, 8)}...
                     </span>
                  )}
                  </div>
               </div>
               </div>
               <div className="text-right">
               <p
                  className={`font-bold text-lg ${
                  t.transaction_type === "credit"
                     ? "text-green-600"
                     : "text-red-600"
                  }`}
               >
                  {t.transaction_type === "credit" ? "+" : "-"}$
                  {t.amount}
               </p>
               <p className="text-sm text-gray-500">
                  Balance: ${t.balance_after}
               </p>
               </div>
            </div>
         ))}

         {/* Pagination */}
         <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
               Showing {(transactionsPage - 1) * 20 + 1}–{(transactionsPage - 1) * 20 + transactions?.results.length} of{" "}
               {transactions?.count} transactions
            </p>
            <div className="flex gap-2">
               <button
               onClick={() =>
                  setTransactionsPage((p) => Math.max(1, p - 1))
               }
               disabled={!transactions?.previous}
               className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
               >
               Previous
               </button>
               <button
               onClick={() => setTransactionsPage((p) => p + 1)}
               disabled={!transactions?.next}
               className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
               >
               Next
               </button>
            </div>
         </div>
      </div>
      )}
   </div>
  )
}

export default TransactionsTab
