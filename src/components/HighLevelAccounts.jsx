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
} from 'lucide-react';

import {
  useGetHighlevelAccountsQuery,
  useDeleteHighlevelAccountMutation,
  useUpdateHighlevelAccountMutation,
} from '../store/api/highlevelAccountApi';

import { useGetAvailableNumbersQuery, useGetLocationNumbersQuery } from '../store/api/dashboardApi';

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
    outbound_segment_charge: ''
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
      outbound_segment_charge: account?.wallet?.outbound_segment_charge
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
          outbound_segment_charge: newAccount?.outbound_segment_charge
        }
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

// Numbers Section Component
const NumbersSection = ({ locationId, formatPhoneNumber }) => {
  const { data: numbersData, isLoading, isError } = useGetLocationNumbersQuery(locationId);

  const registeredNumbers = numbersData?.registered?.results || [];
  const ownedNumbers = numbersData?.owned?.results || [];
  const registeredCount = numbersData?.registered?.count || 0;
  const ownedCount = numbersData?.owned?.count || 0;

  const allNumbers = [...registeredNumbers, ...ownedNumbers];

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
        <p className="text-sm text-gray-500">This account doesn't have any registered or owned numbers yet.</p>
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
          {registeredCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {registeredCount} Registered
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
          />
        ))}
      </div>
    </div>
  );
};

// Number Card Component
const NumberCard = ({ number, formatPhoneNumber }) => {
  const statusColors = {
    registered: "bg-blue-100 text-blue-800 border-blue-200",
    owned: "bg-purple-100 text-purple-800 border-purple-200",
    available: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
          <Phone className="w-3.5 h-3.5 text-gray-400" />
          <span>{formatPhoneNumber(number.number)}</span>
        </h5>
        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[number.status]}`}>
          {number.status}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <DollarSign className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-medium">${number.price}</span>
        </div>

        {number.last_synced_at && (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>Synced: {new Date(number.last_synced_at).toLocaleDateString()}</span>
          </div>
        )}

        {number.is_active && (
          <div className="pt-1.5 border-t border-gray-100">
            <span className="inline-flex items-center text-xs text-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </span>
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