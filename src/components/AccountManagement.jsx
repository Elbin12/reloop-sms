import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Link,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Building,
  Radio,
  ArrowRight
} from 'lucide-react';

const AccountManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [newMapping, setNewMapping] = useState({
    hlAccountId: '',
    transmitAccountId: '',
    status: 'active',
    notes: ''
  });

  // Mock data for HighLevel accounts (would come from HighLevelAccounts component)
  const hlAccounts = [
    { id: 1, name: 'Gracify Media', subaccount: 'Main Account', status: 'connected' },
    { id: 2, name: 'Life.fm', subaccount: 'Broadcasting', status: 'connected' },
    { id: 3, name: 'Digital Solutions', subaccount: 'Enterprise', status: 'connected' },
    { id: 4, name: 'Marketing Pro', subaccount: 'Client A', status: 'error' }
  ];

  // Mock data for Transmit SMS accounts (would come from TransmitAccounts component)
  const transmitAccounts = [
    { id: 1, name: 'Transmit US Main', accountId: 'TR_001', status: 'connected' },
    { id: 2, name: 'Transmit Broadcasting', accountId: 'TR_045', status: 'connected' },
    { id: 3, name: 'Transmit Enterprise', accountId: 'TR_067', status: 'connected' },
    { id: 4, name: 'Transmit Test Account', accountId: 'TR_023', status: 'error' }
  ];

  // Account mappings
  const mappings = [
    {
      id: 1,
      hlAccount: { id: 1, name: 'Gracify Media', subaccount: 'Main Account' },
      transmitAccount: { id: 1, name: 'Transmit US Main', accountId: 'TR_001' },
      status: 'active',
      createdAt: '2024-01-10',
      lastSync: '2 hours ago',
      messageCount: 1247,
      notes: 'Primary account mapping for main operations'
    },
    {
      id: 2,
      hlAccount: { id: 2, name: 'Life.fm', subaccount: 'Broadcasting' },
      transmitAccount: { id: 2, name: 'Transmit Broadcasting', accountId: 'TR_045' },
      status: 'active',
      createdAt: '2024-01-08',
      lastSync: '15 minutes ago',
      messageCount: 892,
      notes: 'Broadcasting account for radio station'
    },
    {
      id: 3,
      hlAccount: { id: 3, name: 'Digital Solutions', subaccount: 'Enterprise' },
      transmitAccount: { id: 3, name: 'Transmit Enterprise', accountId: 'TR_067' },
      status: 'active',
      createdAt: '2024-01-05',
      lastSync: '5 minutes ago',
      messageCount: 2156,
      notes: 'Enterprise client with high volume messaging'
    },
    {
      id: 4,
      hlAccount: { id: 4, name: 'Marketing Pro', subaccount: 'Client A' },
      transmitAccount: { id: 4, name: 'Transmit Test Account', accountId: 'TR_023' },
      status: 'inactive',
      createdAt: '2024-01-12',
      lastSync: '3 days ago',
      messageCount: 0,
      notes: 'Test mapping - currently inactive'
    }
  ];

  const filteredMappings = mappings.filter(mapping =>
    mapping.hlAccount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.hlAccount.subaccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.transmitAccount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.transmitAccount.accountId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMapping = (e) => {
    e.preventDefault();
    const selectedHLAccount = hlAccounts.find(acc => acc.id === parseInt(newMapping.hlAccountId));
    const selectedTransmitAccount = transmitAccounts.find(acc => acc.id === parseInt(newMapping.transmitAccountId));
    
    if (selectedHLAccount && selectedTransmitAccount) {
      console.log('Adding account mapping:', {
        hlAccount: selectedHLAccount,
        transmitAccount: selectedTransmitAccount,
        status: newMapping.status,
        notes: newMapping.notes
      });
      setShowAddMapping(false);
      setNewMapping({
        hlAccountId: '',
        transmitAccountId: '',
        status: 'active',
        notes: ''
      });
    }
  };

  const handleInputChange = (e) => {
    setNewMapping({
      ...newMapping,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Mappings</h1>
          <p className="text-gray-600 mt-2">Map HighLevel accounts to Transmit SMS accounts for SMS routing</p>
        </div>
        <button 
          onClick={() => setShowAddMapping(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Mapping</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Mappings</p>
              <p className="text-2xl font-bold text-gray-900">{mappings.length}</p>
            </div>
            <Link className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {mappings.filter(m => m.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-amber-600">
                {mappings.filter(m => m.status === 'inactive').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-indigo-600">
                {mappings.reduce((sum, mapping) => sum + mapping.messageCount, 0).toLocaleString()}
              </p>
            </div>
            <Radio className="w-8 h-8 text-indigo-500" />
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
                placeholder="Search account mappings..."
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
                  HighLevel Account
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mapping
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transmit SMS Account
                </th>
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
              {filteredMappings.map((mapping) => (
                <tr key={mapping.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{mapping.hlAccount.name}</div>
                        <div className="text-sm text-gray-500">{mapping.hlAccount.subaccount}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <ArrowRight className="w-5 h-5 text-gray-400 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Radio className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{mapping.transmitAccount.name}</div>
                        <div className="text-sm text-gray-500">{mapping.transmitAccount.accountId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {mapping.status === 'active' ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mapping.messageCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {mapping.lastSync}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800 transition-colors">
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

        {mappings.notes && (
          <div className="px-6 pb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Notes:</span> {mapping.notes}
              </p>
            </div>
          </div>
        )}
      </div>

      {showAddMapping && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Account Mapping</h3>
              <p className="text-sm text-gray-600 mt-1">Map a HighLevel account to a Transmit SMS account for SMS routing</p>
            </div>
            <form onSubmit={handleAddMapping} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HighLevel Account *
                  </label>
                  <select
                    name="hlAccountId"
                    value={newMapping.hlAccountId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select HighLevel Account</option>
                    {hlAccounts.filter(acc => acc.status === 'connected').map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - {account.subaccount}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Only connected HighLevel accounts are shown
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transmit SMS Account *
                  </label>
                  <select
                    name="transmitAccountId"
                    value={newMapping.transmitAccountId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Transmit SMS Account</option>
                    {transmitAccounts.filter(acc => acc.status === 'connected').map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.accountId})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Only connected Transmit SMS accounts are shown
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={newMapping.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={newMapping.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional notes about this mapping..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Mapping Preview</h4>
                    <div className="mt-2 text-sm text-blue-700">
                      {newMapping.hlAccountId && newMapping.transmitAccountId ? (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {hlAccounts.find(acc => acc.id === parseInt(newMapping.hlAccountId))?.name}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                          <span className="font-medium">
                            {transmitAccounts.find(acc => acc.id === parseInt(newMapping.transmitAccountId))?.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-blue-600">Select both accounts to see mapping preview</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </form>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button 
                type="button"
                onClick={() => setShowAddMapping(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddMapping}
                disabled={!newMapping.hlAccountId || !newMapping.transmitAccountId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Mapping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;