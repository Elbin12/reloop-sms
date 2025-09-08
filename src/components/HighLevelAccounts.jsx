import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';

import {
  useGetHighlevelAccountsQuery,
  useDeleteHighlevelAccountMutation,
  useUpdateHighlevelAccountMutation,
} from '../store/api/highlevelAccountApi'; // adjust path if needed

import { BASE_URL } from '../store/axios/axios';

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

  // RTK Query hook
  const {
    data: accountsData = {},
    isLoading,
    isError,
  } = useGetHighlevelAccountsQuery({ page: currentPage }); // pass page param

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
      await updateAccount({ id: editingAccount.id, location_name: newAccount.location_name,
        wallet:{inbound_segment_charge: newAccount?.inbound_segment_charge, outbound_segment_charge: newAccount?.outbound_segment_charge}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HighLevel Accounts</h1>
          <p className="text-gray-600 mt-2">Manage HighLevel account connections</p>
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
                  <TableHeadCell>Account Details</TableHeadCell>
                  {/* <TableHeadCell>User Type</TableHeadCell> */}
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
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{account.location_name}</div>
                        <div className="text-sm text-gray-500">ID: {account.location_id}</div>
                      </td>
                      {/* <td className="px-6 py-4 text-sm text-gray-900">{account.user_type}</td>   */}
                      <td className="px-6 py-4 text-sm text-gray-500">{account.business_email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{account.business_phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{account.wallet? account.wallet?.balance: 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{account.wallet? account.wallet?.inbound_segment_charge: 'Nil'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{account.wallet? account.wallet?.outbound_segment_charge: 'Nil'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{account.timezone}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(account?.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                          {/* <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-4 h-4" />
                          </button> */}
                        </div>
                      </td>
                    </tr>
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
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
