import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Building,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Globe,
  X,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Phone,
  Calendar,
  DollarSign,
  Hash,
  ExternalLink,
  Star,
  Wallet,
} from 'lucide-react';

import {
  useGetHighlevelAccountsQuery,
  useDeleteHighlevelAccountMutation,
  useUpdateHighlevelAccountMutation,
} from '../store/api/highlevelAccountApi';

import { useBuyPremiumNumbersMutation, useGetAvailableNumbersQuery, useGetLocationNumbersQuery } from '../store/api/dashboardApi';

import { BASE_URL } from '../store/axios/axios';
import { useLocation } from 'react-router-dom';

// Shimmer/Skeleton Components
const Shimmer = ({ className = "" }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded ${className}`} />
);

const NumberCardSkeleton = () => (
  <div className="border border-gray-200 rounded-lg p-3">
    <div className="flex items-center justify-between mb-2">
      <Shimmer className="h-5 w-32" />
      <Shimmer className="h-5 w-16 rounded-full" />
    </div>
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Shimmer className="w-4 h-4 rounded" />
        <Shimmer className="h-3 w-24" />
      </div>
      <div className="flex items-center space-x-2">
        <Shimmer className="w-4 h-4 rounded" />
        <Shimmer className="h-3 w-32" />
      </div>
    </div>
  </div>
);

const Toast = ({ message, onClose }) => (
  <div className="fixed top-4 right-4 z-50 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg max-w-md">
    <div className="flex items-start">
      <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
      <div className="ml-3 flex-1">
        <p className="text-sm text-yellow-700 mt-1">{message}</p>
      </div>
      <button onClick={onClose} className="ml-4 text-yellow-400 hover:text-yellow-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const HighLevelAccounts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [newAccount, setNewAccount] = useState({
    location_name: '',
    inbound_segment_charge:'',
    outbound_segment_charge: '',
    max_premium_numbers: '',
    max_standard_numbers: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [warningMessage, setWarningMessage] = useState('');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const warning = params.get('warning');
    
    if (warning) {
      setWarningMessage(decodeURIComponent(warning));
      const timer = setTimeout(() => {
        setWarningMessage('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location.search]);

  const {
    data: accountsData = {},
    isLoading,
    isError,
  } = useGetHighlevelAccountsQuery({ page: currentPage });

  const accounts = accountsData?.results || [];
  const totalCount = accountsData?.count || 0;
  const pageSize = 10;
  const totalPages = Math.ceil(totalCount / pageSize);

  const [deleteAccount] = useDeleteHighlevelAccountMutation();
  const [updateAccount] = useUpdateHighlevelAccountMutation();

  const handleOnboard = () => {
    window.location.href = `${BASE_URL}/core/auth/connect/`;
  };

  const handleDeleteAccount = async (id) => {
    if (window.confirm('Are you sure you want to delete this HighLevel account?')) {
      try {
        await deleteAccount(id);
      } catch (err) {
        console.error('Failed to delete account:', err);
      }
    }
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setNewAccount({
      location_name: account.location_name,
      inbound_segment_charge: account?.wallet?.inbound_segment_charge,
      outbound_segment_charge: account?.wallet?.outbound_segment_charge,
      max_premium_numbers: account?.max_premium_numbers,
      max_standard_numbers: account?.max_standard_numbers,
    });
    setShowEditModal(true);
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount) return;
    try {
      await updateAccount({ 
        id: editingAccount.id, 
        location_name: newAccount.location_name,
        wallet: {
          inbound_segment_charge: newAccount?.inbound_segment_charge, 
          outbound_segment_charge: newAccount?.outbound_segment_charge,
        },
        max_premium_numbers: newAccount?.max_premium_numbers,
        max_standard_numbers: newAccount?.max_standard_numbers,
      });
      setShowEditModal(false);
      setEditingAccount(null);
    } catch (err) {
      console.error('Failed to update account:', err);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const toggleRowExpansion = (accountId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const formatPhoneNumber = (number) => {
    if (!number) return "";
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }
    return number;
  };

  return (
    <div className="space-y-6">
      {warningMessage && (
        <Toast 
          message={warningMessage} 
          onClose={() => setWarningMessage('')} 
        />
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HighLevel Accounts</h1>
          <p className="text-gray-600 mt-2">Manage HighLevel account connections and associated numbers</p>
        </div>
        <button
          onClick={handleOnboard}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add HighLevel Account</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Accounts" value={totalCount} icon={<Building className="w-8 h-8 text-blue-500" />} />
        <SummaryCard title="Connected" value={accounts.filter(a => a.status === 'connected').length} icon={<CheckCircle className="w-8 h-8 text-green-500" />} />
        <SummaryCard title="Errors" value={accounts.filter(a => a.status === 'error').length} icon={<AlertCircle className="w-8 h-8 text-red-500" />} />
        <SummaryCard title="Timezones" value={[...new Set(accounts.map(a => a.timezone))].length} icon={<Globe className="w-8 h-8 text-indigo-500" />} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by location name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <p className="p-6 text-gray-500">Loading accounts...</p>
          ) : isError ? (
            <p className="p-6 text-red-500">Failed to load accounts.</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <TableHeadCell>
                    <div className="w-8"></div>
                  </TableHeadCell>
                  <TableHeadCell>Account Details</TableHeadCell>
                  <TableHeadCell>Business Email</TableHeadCell>
                  <TableHeadCell>Business Phone</TableHeadCell>
                  <TableHeadCell>Balance</TableHeadCell>
                  <TableHeadCell>Inbound Charge</TableHeadCell>
                  <TableHeadCell>Outbound Charge</TableHeadCell>
                  <TableHeadCell>Time Zone</TableHeadCell>
                  <TableHeadCell>Created At</TableHeadCell>
                  <TableHeadCell>Actions</TableHeadCell>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts
                  .filter(acc => acc.location_name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((account) => (
                    <React.Fragment key={account.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleRowExpansion(account.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {expandedRows.has(account.id) ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{account.location_name}</div>
                          <div className="text-sm text-gray-500">ID: {account.location_id}</div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">{account.business_email}</td>
                        <td className="px-3 py-4 text-sm text-gray-500">{account.business_phone}</td>
                        <td className="px-3 py-4 text-sm text-gray-500">{account.wallet ? account.wallet?.balance : 0}</td>
                        <td className="px-3 py-4 text-sm text-gray-500">{account.wallet ? account.wallet?.inbound_segment_charge : 'Nil'}</td>
                        <td className="px-3 py-4 text-sm text-gray-500">{account.wallet ? account.wallet?.outbound_segment_charge : 'Nil'}</td>
                        <td className="px-3 py-4 text-sm text-gray-500">{account.timezone}</td>
                        <td className="px-3 py-4 text-sm text-gray-500">{new Date(account?.created_at).toLocaleDateString()}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditAccount(account)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(account.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows.has(account.id) && (
                        <tr>
                          <td colSpan="10" className="px-3 py-4 bg-gray-50">
                            <NumbersSection 
                              locationId={account.location_id} 
                              formatPhoneNumber={formatPhoneNumber}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-4 border-t border-gray-200">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit HighLevel Account</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <InputField
                label="Location Name"
                value={newAccount.location_name}
                onChange={(e) => setNewAccount({ ...newAccount, location_name: e.target.value })}
              />
              <InputField
                label="Inbound Charge"
                value={newAccount.inbound_segment_charge}
                onChange={(e) => setNewAccount({ ...newAccount, inbound_segment_charge: e.target.value })}
              />
              <InputField
                label="Outbound Charge"
                value={newAccount.outbound_segment_charge}
                onChange={(e) => setNewAccount({ ...newAccount, outbound_segment_charge: e.target.value })}
              />
              <InputField
                label="Maximum standard number can buy"
                value={newAccount.max_standard_numbers}
                onChange={(e) => setNewAccount({ ...newAccount, max_standard_numbers: e.target.value })}
              />
              <InputField
                label="Maximum premium number can buy"
                value={newAccount.max_premium_numbers}
                onChange={(e) => setNewAccount({ ...newAccount, max_premium_numbers: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAccount}
                disabled={!newAccount.location_name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

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
  );
};

const PurchaseConfirmationModal = ({ isOpen, onClose, onConfirm, number, formatPhoneNumber, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Purchase Premium Number
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            You are about to purchase the following premium number:
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Phone Number</span>
              <span className="text-base font-semibold text-gray-900">
                {formatPhoneNumber(number.number)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-sm text-gray-600 flex items-center">
                <Wallet className="w-4 h-4 mr-1.5" />
                Amount to Deduct from Wallet
              </span>
              <span className="text-xl font-bold text-orange-600">
                ${number.price}
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <p className="text-xs text-yellow-800 leading-relaxed">
              <strong className="font-semibold">⚠️ Important:</strong> This amount will be immediately deducted from your wallet balance. 
              Please ensure you have sufficient funds. This action cannot be undone.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 
                       transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 
                       transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Confirm Purchase
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Numbers Section Component
const NumbersSection = ({ locationId, formatPhoneNumber }) => {
  const { data: numbersData, isLoading, isError } = useGetLocationNumbersQuery(locationId);
  const [buyPremiumNumber, { isLoading: isPurchasing }] = useBuyPremiumNumbersMutation();
  
  const [modalState, setModalState] = useState({
    isOpen: false,
    selectedNumber: null,
  });

  const pendingNumbers = numbersData?.pending?.results || [];
  const ownedNumbers = numbersData?.owned?.results || [];
  const pendingCount = numbersData?.pending?.count || 0;
  const ownedCount = numbersData?.owned?.count || 0;

  const allNumbers = [...pendingNumbers, ...ownedNumbers];

  const handlePurchaseClick = (number) => {
    setModalState({
      isOpen: true,
      selectedNumber: number,
    });
  };

  const handleCloseModal = () => {
    if (!isPurchasing) {
      setModalState({
        isOpen: false,
        selectedNumber: null,
      });
    }
  };

  const handleConfirmPurchase = async () => {
    try {
      await buyPremiumNumber({
        payload: {
          number: modalState.selectedNumber.number,
          location_id: locationId,
        },
      }).unwrap();
      
      // Success - close modal
      setModalState({
        isOpen: false,
        selectedNumber: null,
      });
      
      // Optional: Show success toast/notification
      // toast.success('Premium number purchased successfully!');
    } catch (error) {
      // Error handling - you can show an error toast here
      console.error('Failed to purchase premium number:', error);
      // toast.error(error?.data?.message || 'Failed to purchase number');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <NumberCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-4">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-600">Failed to load numbers</p>
      </div>
    );
  }

  if (allNumbers.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
        <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h4 className="text-sm font-medium text-gray-900 mb-1">No Numbers Associated</h4>
        <p className="text-sm text-gray-500">This account doesn't have any pending or owned numbers yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with counts */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Phone className="w-5 h-5 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-900">Associated Numbers</h4>
        </div>
        <div className="flex items-center space-x-4">
          {pendingCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Star className="w-3 h-3 mr-1" />
              {pendingCount} Premium Requested
            </span>
          )}
          {ownedCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {ownedCount} Owned
            </span>
          )}
        </div>
      </div>

      {/* Numbers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {allNumbers.map((number) => (
          <NumberCard 
            key={number.id} 
            number={number} 
            formatPhoneNumber={formatPhoneNumber}
            onPurchase={handlePurchaseClick}
          />
        ))}
      </div>

      {/* Purchase Confirmation Modal */}
      <PurchaseConfirmationModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmPurchase}
        number={modalState.selectedNumber}
        formatPhoneNumber={formatPhoneNumber}
        isLoading={isPurchasing}
      />
    </div>
  );
};

// Number Card Component
const NumberCard = ({ number, formatPhoneNumber, onPurchase }) => {
  const statusColors = {
    registered: "bg-blue-100 text-blue-800 border-blue-200",
    owned: "bg-purple-100 text-purple-800 border-purple-200",
    available: "bg-green-100 text-green-800 border-green-200",
    pending: "bg-orange-100 text-orange-800 border-orange-200",
  };

  const isPending = number.status === 'pending';

  return (
    <div className={`bg-white border rounded-lg p-3 hover:shadow-md transition-shadow ${
      isPending ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
          <Phone className="w-3.5 h-3.5 text-gray-400" />
          <span>{formatPhoneNumber(number.number)}</span>
        </h5>
        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[number.status]}`}>
          {isPending && <Star className="w-3 h-3 mr-1" />}
          {isPending ? 'Premium' : number.status}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <DollarSign className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-medium">${number.price}</span>
          {isPending && (
            <span className="text-orange-600 font-semibold">(Pending Payment)</span>
          )}
        </div>

        {number.last_synced_at && (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>Synced: {new Date(number.last_synced_at).toLocaleDateString()}</span>
          </div>
        )}

        {number.is_active && !isPending && (
          <div className="pt-1.5 border-t border-gray-100">
            <span className="inline-flex items-center text-xs text-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </span>
          </div>
        )}

        {isPending && (
          <div className="pt-2 mt-2 border-t border-orange-100">
            <button
              onClick={() => onPurchase(number)}
              className="w-full px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 
                       transition-colors text-xs font-medium flex items-center justify-center space-x-1.5"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Purchase Premium Number</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable components
const SummaryCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      {icon}
    </div>
  </div>
);

const TableHeadCell = ({ children }) => (
  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    {children}
  </th>
);

const InputField = ({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

export default HighLevelAccounts;