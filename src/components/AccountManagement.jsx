import React, { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Link, CheckCircle, AlertCircle, Edit, Trash2, Building, Radio, ArrowRight, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCreateAccountMappingMutation, useDeleteAccountMappingMutation, useGetAccountMappingsQuery } from '../store/api/accountMappingApi';
import { useGetHighlevelAccountsQuery } from '../store/api/highlevelAccountApi';
import { useGetTransmitsmsAccountsQuery } from '../store/api/transmitsmsaccountApi';

const AccountManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [newMapping, setNewMapping] = useState({
    ghl_account: '',
    transmit_account: '',
    notes: ''
  });

  // Redux API calls
  const {
    data: mappingsResponse,
    isLoading,
    isError,
    error
  } = useGetAccountMappingsQuery({ page: currentPage });

  const [createAccountMapping, {
    isLoading: isCreating
  }] = useCreateAccountMappingMutation();

  const [deleteAccountMapping, {
    isLoading: isDeleting
  }] = useDeleteAccountMappingMutation();

  const { data: hlAccountsResponse } = useGetHighlevelAccountsQuery({ page: 1 });
  const { data: transmitAccountsResponse } = useGetTransmitsmsAccountsQuery({ page: 1 });

  // Extract data from paginated responses
  const mappingsData = mappingsResponse?.results || [];
  const hlAccounts = hlAccountsResponse?.results || [];
  const transmitAccounts = transmitAccountsResponse?.results || [];

  // Pagination info
  const totalCount = mappingsResponse?.count || 0;
  const hasNext = mappingsResponse?.next !== null;
  const hasPrevious = mappingsResponse?.previous !== null;

  // Helper function to get account details by ID
  const getHLAccountById = (id) => hlAccounts?.find(acc => acc.id === id);
  const getTransmitAccountById = (id) => transmitAccounts?.find(acc => acc.id === id);

  // Enhanced mappings data with account details
  const enhancedMappings = mappingsData.map(mapping => ({
    ...mapping,
    hlAccount: getHLAccountById(mapping.ghl_account) || {
      location_name: 'Unknown HL Account',
      subaccount: 'N/A',
      name: 'Unknown HL Account'
    },
    transmitAccount: getTransmitAccountById(mapping.transmit_account) || {
      account_name: 'Unknown Transmit Account',
      account_id: 'N/A',
      name: 'Unknown Transmit Account'
    }
  }));

  const filteredMappings = enhancedMappings.filter(mapping =>
    mapping.hlAccount.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.hlAccount.subaccount?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.transmitAccount.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.transmitAccount.account_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMapping = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ghl_account: newMapping.ghl_account,
        transmit_account: newMapping.transmit_account
      };
      await createAccountMapping(payload).unwrap();

      setShowAddMapping(false);
      setNewMapping({
        ghl_account: '',
        transmit_account: '',
        notes: ''
      });
    } catch (error) {
      console.error('Failed to create account mapping:', error);
      // You might want to show a toast notification or error message here
    }
  };

  const handleDeleteMapping = async (id) => {
    if (window.confirm('Are you sure you want to delete this mapping?')) {
      try {
        await deleteAccountMapping(id).unwrap();
      } catch (error) {
        console.error('Failed to delete account mapping:', error);
        // You might want to show a toast notification or error message here
      }
    }
  };

  const handleInputChange = (e) => {
    setNewMapping({
      ...newMapping,
      [e.target.name]: e.target.value
    });
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (hasPrevious) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNext) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Calculate stats
  const totalMappings = totalCount;
  const activeMappings = mappingsData.filter(m => m.status === 'active').length;
  const inactiveMappings = mappingsData.filter(m => m.status === 'inactive').length;
  const totalMessages = mappingsData.reduce((sum, mapping) => sum + (mapping.messageCount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">Failed to load account mappings: {error?.message || 'Unknown error'}</span>
        </div>
      </div>
    );
  }

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
          disabled={isCreating}
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>{isCreating ? 'Creating...' : 'Add Mapping'}</span>
        </button>
      </div>

      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Mappings</p>
              <p className="text-2xl font-bold text-gray-900">{totalMappings}</p>
            </div>
            <Link className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{activeMappings}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-amber-600">{inactiveMappings}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-indigo-600">
                {totalMessages.toLocaleString()}
              </p>
            </div>
            <Radio className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
      </div> */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-7 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search account mappings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {/* <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button> */}
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
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No matching account mappings found' : 'No account mappings found'}
                  </td>
                </tr>
              ) : (
                filteredMappings.map((mapping) => (
                  <tr key={mapping.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {mapping.hlAccount.location_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {mapping.hlAccount.subaccount || 'Main Account'}
                          </div>
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
                          <div className="text-sm font-medium text-gray-900">
                            {mapping.transmitAccount.account_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {mapping.transmitAccount.account_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mapping.mapped_at ? new Date(mapping.mapped_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-red-600 hover:text-red-800 transition-colors"
                          onClick={() => handleDeleteMapping(mapping.id)}
                          disabled={isDeleting}
                          title="Delete mapping"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Basic Pagination */}
        {(hasNext || hasPrevious) && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Previous Page */}
              <button
                onClick={handlePreviousPage}
                disabled={!hasPrevious}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {/* Next Page */}
              <button
                onClick={handleNextPage}
                disabled={!hasNext}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
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
                    name="ghl_account"
                    value={newMapping.ghl_account}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={isCreating}
                  >
                    <option value="">Select HighLevel Account</option>
                    {hlAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.location_name}
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
                    name="transmit_account"
                    value={newMapping.transmit_account}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={isCreating}
                  >
                    <option value="">Select Transmit SMS Account</option>
                    {transmitAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.account_name} - {account.account_id}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Only connected Transmit SMS accounts are shown
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Mapping Preview</h4>
                    <div className="mt-2 text-sm text-blue-700">
                      {newMapping.ghl_account && newMapping.transmit_account ? (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {hlAccounts.find(acc => acc.id === newMapping.ghl_account)?.location_name}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                          <span className="font-medium">
                            {transmitAccounts.find(acc => acc.id === newMapping.transmit_account)?.account_name}
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
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMapping}
                disabled={!newMapping.ghl_account || !newMapping.transmit_account || isCreating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isCreating ? 'Creating...' : 'Create Mapping'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
