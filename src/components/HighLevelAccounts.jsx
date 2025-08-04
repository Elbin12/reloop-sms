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
  Key,
  Globe,
  X
} from 'lucide-react';

const HighLevelAccounts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [newAccount, setNewAccount] = useState({
    name: '',
    subaccount: '',
    apiKey: '',
    webhookUrl: '',
    status: 'active',
    notes: ''
  });

  const [accounts, setAccounts] = useState([
    {
      id: 1,
      name: 'Gracify Media',
      subaccount: 'Main Account',
      apiKey: 'hl_live_••••••••••••••••••••••••••••••••',
      webhookUrl: 'https://services.leadconnectorhq.com/hooks/gracify',
      status: 'connected',
      lastSync: '2 hours ago',
      messageCount: 1247,
      createdAt: '2024-01-10'
    },
    {
      id: 2,
      name: 'Life.fm',
      subaccount: 'Broadcasting',
      apiKey: 'hl_live_••••••••••••••••••••••••••••••••',
      webhookUrl: 'https://services.leadconnectorhq.com/hooks/lifefm',
      status: 'connected',
      lastSync: '15 minutes ago',
      messageCount: 892,
      createdAt: '2024-01-08'
    },
    {
      id: 3,
      name: 'Digital Solutions',
      subaccount: 'Enterprise',
      apiKey: 'hl_live_••••••••••••••••••••••••••••••••',
      webhookUrl: 'https://services.leadconnectorhq.com/hooks/digital',
      status: 'connected',
      lastSync: '5 minutes ago',
      messageCount: 2156,
      createdAt: '2024-01-05'
    },
    {
      id: 4,
      name: 'Marketing Pro',
      subaccount: 'Client A',
      apiKey: 'hl_live_••••••••••••••••••••••••••••••••',
      webhookUrl: 'https://services.leadconnectorhq.com/hooks/marketing',
      status: 'error',
      lastSync: '3 days ago',
      messageCount: 0,
      createdAt: '2024-01-12'
    }
  ]);

  const handleDeleteAccount = (id) => {
    if (window.confirm('Are you sure you want to delete this HighLevel account?')) {
      setAccounts(accounts.filter(account => account.id !== id));
    }
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setNewAccount({
      name: account.name,
      apiKey: account.apiKey,
      webhookUrl: account.webhookUrl,
      notes: account.notes
    });
    setShowEditModal(true);
  };

  const handleUpdateAccount = () => {
    if (newAccount.name && newAccount.apiKey && newAccount.webhookUrl) {
      setAccounts(accounts.map(account => 
        account.id === editingAccount.id 
          ? {
              ...account,
              name: newAccount.name,
              apiKey: newAccount.apiKey,
              webhookUrl: newAccount.webhookUrl,
              notes: newAccount.notes,
              lastSync: new Date().toLocaleString()
            }
          : account
      ));
      
      setNewAccount({ name: '', apiKey: '', webhookUrl: '', notes: '' });
      setShowEditModal(false);
      setEditingAccount(null);
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.subaccount.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddAccount = (e) => {
    e.preventDefault();
    // Here you would typically make an API call to add the account
    console.log('Adding HighLevel account:', newAccount);
    setShowAddAccount(false);
    setNewAccount({
      name: '',
      subaccount: '',
      apiKey: '',
      webhookUrl: '',
      status: 'active'
    });
  };

  const handleInputChange = (e) => {
    setNewAccount({
      ...newAccount,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HighLevel Accounts</h1>
          <p className="text-gray-600 mt-2">Manage HighLevel account connections and API configurations</p>
        </div>
        <button 
          onClick={() => setShowAddAccount(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add HighLevel Account</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
            </div>
            <Building className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Connected</p>
              <p className="text-2xl font-bold text-green-600">
                {accounts.filter(a => a.status === 'connected').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-red-600">
                {accounts.filter(a => a.status === 'error').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-indigo-600">
                {accounts.reduce((sum, acc) => sum + acc.messageCount, 0).toLocaleString()}
              </p>
            </div>
            <Globe className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search HighLevel accounts..."
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
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Details
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  API Configuration
                </th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Messages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Sync
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{account.name}</div>
                        <div className="text-sm text-gray-500">{account.subaccount}</div>
                      </div>
                    </div>
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Key className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600 font-mono">{account.apiKey}</span>
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {account.webhookUrl}
                      </div>
                    </div>
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {account.status === 'connected' ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600">Error</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.messageCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.lastSync}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditAccount(account)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteAccount(account.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add HighLevel Account</h3>
              <p className="text-sm text-gray-600 mt-1">Configure a new HighLevel account connection</p>
            </div>
            <form onSubmit={handleAddAccount} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newAccount.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Gracify Media"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subaccount Name *
                  </label>
                  <input
                    type="text"
                    name="subaccount"
                    value={newAccount.subaccount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Main Account"
                    required
                  />
                </div>
              </div>
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key *
                </label>
                <input
                  type="password"
                  name="apiKey"
                  value={newAccount.apiKey}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="hl_live_••••••••••••••••••••••••••••••••"
                  required
                />
              </div> */}
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL *
                </label>
                <input
                  type="url"
                  name="webhookUrl"
                  value={newAccount.webhookUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://services.leadconnectorhq.com/hooks/..."
                  required
                />
              </div> */}
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={newAccount.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div> */}
            </form>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button 
                type="button"
                onClick={() => setShowAddAccount(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddAccount}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit HighLevel Account</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                  placeholder="Enter account name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={newAccount.apiKey}
                  onChange={(e) => setNewAccount({...newAccount, apiKey: e.target.value})}
                  placeholder="Enter API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div> */}
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={newAccount.webhookUrl}
                  onChange={(e) => setNewAccount({...newAccount, webhookUrl: e.target.value})}
                  placeholder="https://your-webhook-url.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div> */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={newAccount.notes}
                  onChange={(e) => setNewAccount({...newAccount, notes: e.target.value})}
                  placeholder="Add any notes about this account..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAccount}
                disabled={!newAccount.name || !newAccount.apiKey || !newAccount.webhookUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Update Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HighLevelAccounts;