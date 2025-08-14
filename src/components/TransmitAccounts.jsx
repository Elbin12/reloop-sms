import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Radio,
  CheckCircle,
  Phone,
  Globe,
  X,
} from 'lucide-react';
import {
  useCreateTransmitsmsAccountMutation,
  useDeleteTransmitsmsAccountMutation,
  useGetTransmitsmsAccountsQuery,
  useUpdateTransmitsmsAccountMutation,
} from '../store/api/transmitsmsaccountApi';

const TransmitAccounts = () => {
  const [page, setPage] = useState(1);
  const { data: accountsData = {}, isLoading, refetch } = useGetTransmitsmsAccountsQuery({ page });

  const [createAccount] = useCreateTransmitsmsAccountMutation();
  const [updateAccount] = useUpdateTransmitsmsAccountMutation();
  const [deleteAccount] = useDeleteTransmitsmsAccountMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const [newAccount, setNewAccount] = useState({
    name: '',
    accountId: '',
    apiKey: '',
    apiSecret: '',
    region: 'US',
    status: 'active',
    leasedNumbers: '',
    notes: ''
  });

  const accounts = accountsData?.results || [];
  const totalCount = accountsData?.count || 0;
  const nextPageAvailable = !!accountsData?.next;
  const prevPageAvailable = !!accountsData?.previous;

  const filteredAccounts = accounts.filter(account =>
    account?.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account?.account_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    setNewAccount({
      ...newAccount,
      [e.target.name]: e.target.value
    });
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      await createAccount({
        account_name: newAccount.name,
        api_key: newAccount.apiKey,
        api_secret: newAccount.apiSecret,
        account_id: newAccount.accountId
      }).unwrap();
      setShowAddAccount(false);
      setNewAccount({
        name: '',
        accountId: '',
        apiKey: '',
        apiSecret: '',
        region: 'US',
        status: 'active',
        leasedNumbers: '',
        notes: ''
      });
      setPage(1);
      refetch();
    } catch (err) {
      console.error('Error adding account:', err);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (window.confirm('Are you sure you want to delete this Transmit SMS account?')) {
      try {
        await deleteAccount(id).unwrap();
        setPage(1);
        refetch();
      } catch (err) {
        console.error('Error deleting account:', err);
      }
    }
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setNewAccount({
      name: account.account_name || '',
      apiKey: account.api_key || '',
      apiSecret: account.api_secret || '',
      accountId: account.account_id || '',
      region: account.region || 'US',
      leasedNumbers: account.leasedNumbers?.join(', ') || '',
      notes: account.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (editingAccount?.id && newAccount.name && newAccount.apiKey) {
      try {
        await updateAccount({
          id: editingAccount.id,
          account_name: newAccount.name,
          api_key: newAccount.apiKey,
          api_secret: newAccount.apiSecret,
          account_id: newAccount.accountId
        }).unwrap();
        setShowEditModal(false);
        setEditingAccount(null);
        refetch();
      } catch (err) {
        console.error('Error updating account:', err);
      }
    }
  };

  if (isLoading) return <div className="text-center py-10">Loading Transmit SMS Accounts...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transmit SMS Accounts</h1>
          <p className="text-gray-600 mt-2">Manage Transmit SMS account connections and configurations</p>
        </div>
        <button
          onClick={() => {
            setNewAccount({
              name: '',
              accountId: '',
              apiKey: '',
              apiSecret: '',
            });
            setShowAddAccount(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transmit Account</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Accounts" value={totalCount} icon={<Radio className="w-8 h-8 text-indigo-500" />} />
        <StatCard label="Connected" value={accounts.filter(a => a.status === 'connected').length} icon={<CheckCircle className="w-8 h-8 text-green-500" />} />
        <StatCard label="Leased Numbers" value={accounts.reduce((sum, acc) => sum + (acc.leasedNumbers?.length || 0), 0)} icon={<Phone className="w-8 h-8 text-blue-500" />} />
        <StatCard label="Total Messages" value={accounts.reduce((sum, acc) => sum + (acc.messageCount || 0), 0).toLocaleString()} icon={<Globe className="w-8 h-8 text-indigo-500" />} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search Transmit SMS accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Account Name</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Account ID</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Status</th>
                {/* <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Actions</th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-6 py-4">{account.account_name}</td>
                  <td className="px-6 py-4">{account.account_id}</td>
                  <td className="px-6 py-4">
                    {account.status === 'connected' ? (
                      <span className="text-green-600">Connected</span>
                    ) : (
                      <span className="text-red-600">Connected</span>
                    )}
                  </td>
                  {/* <td className="px-6 py-4 space-x-2">
                    <button onClick={() => handleEditAccount(account)} className="text-blue-600 hover:text-blue-800">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteAccount(account.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
          <p className="text-sm text-gray-600">
            Page {page} — Showing {accounts.length} of {totalCount} accounts
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={!prevPageAvailable}
              className={`px-3 py-1 rounded-md border ${prevPageAvailable ? 'bg-white text-gray-700 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!nextPageAvailable}
              className={`px-3 py-1 rounded-md border ${nextPageAvailable ? 'bg-white text-gray-700 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showAddAccount && (
        <Modal title="Add Transmit SMS Account" onClose={() => setShowAddAccount(false)} onSubmit={handleAddAccount}>
          <AccountForm newAccount={newAccount} handleInputChange={handleInputChange} />
        </Modal>
      )}

      {showEditModal && (
        <Modal title="Edit Transmit SMS Account" onClose={() => setShowEditModal(false)} onSubmit={handleUpdateAccount}>
          <AccountForm newAccount={newAccount} handleInputChange={handleInputChange} />
        </Modal>
      )}
    </div>
  );
};

export default TransmitAccounts;

// Helper components
const StatCard = ({ label, value, icon }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      {icon}
    </div>
  </div>
);

const Modal = ({ title, children, onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        {children}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
        </div>
      </form>
    </div>
  </div>
);

const AccountForm = ({ newAccount, handleInputChange }) => (
  <>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
      <input
        type="text"
        name="name"
        value={newAccount.name}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        required
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Account ID</label>
      <input
        type="text"
        name="accountId"
        value={newAccount.accountId}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        required
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
      <input
        type="text"
        name="apiKey"
        value={newAccount.apiKey}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        required
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">API Secret</label>
      <input
        type="text"
        name="apiSecret"
        value={newAccount.apiSecret}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        required
      />
    </div>
  </>
);
