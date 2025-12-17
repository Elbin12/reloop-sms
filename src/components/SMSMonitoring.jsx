import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  Phone,
  MessageSquare,
  ArrowUpDown,
  Calendar,
  User,
  MessageCircle,
  X
} from 'lucide-react';
import { useGetMessagesApiQuery } from '../store/api/messagesApi';

const SMSMonitoring = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('-sent_at');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, page_size: 10 });
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Debounce search term to avoid too many API calls
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [debouncedSearchTerm, statusFilter, directionFilter, sortBy, dateRange]);

  // Build API query parameters
  const queryParams = useMemo(() => {
    const params = {
      page: pagination.page,
      page_size: pagination.page_size,
      ordering: sortBy
    };

    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    if (directionFilter !== 'all') {
      params.direction = directionFilter;
    }

    if (debouncedSearchTerm.trim()) {
      params.search = debouncedSearchTerm.trim();
    }

    if (dateRange.start) {
      params.created_at_gte = dateRange.start;
    }

    if (dateRange.end) {
      params.created_at_lte = dateRange.end;
    }

    return params;
  }, [pagination, statusFilter, directionFilter, sortBy, debouncedSearchTerm, dateRange]);

  const { data, isLoading, isFetching, refetch } = useGetMessagesApiQuery(queryParams);

  const messages = data?.results || [];
  const totalCount = data?.count || 0;

  // Status counts - these reflect the current filtered results
  const statusCounts = useMemo(() => {
    return {
      all: totalCount,
      delivered: messages.filter(m => m.status === 'delivered').length,
      pending: messages.filter(m => m.status === 'pending' || m.status === 'sent').length,
      failed: messages.filter(m => m.status === 'failed').length
    };
  }, [messages, totalCount]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'sent':
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'delivered':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'sent':
      case 'pending':
        return `${baseClasses} bg-amber-100 text-amber-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getPageFromUrl = (url) => {
    if (!url) return null;
    const params = new URL(url).searchParams;
    return params.get('page');
  };

  const handlePageChange = (url) => {
    if (url) {
      const nextPage = getPageFromUrl(url);
      console.log(url, nextPage)
      setPagination({ page: nextPage, page_size: pagination.page_size })
    }
  };

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleStatusFilterChange = useCallback((e) => {
    setStatusFilter(e.target.value);
  }, []);

  const handleDirectionFilterChange = useCallback((e) => {
    setDirectionFilter(e.target.value);
  }, []);

  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value);
  }, []);

  const handleDateRangeChange = useCallback((field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setDirectionFilter('all');
    setSortBy('-sent_at');
    setDateRange({ start: '', end: '' });
  }, []);

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || directionFilter !== 'all' || 
                          dateRange.start || dateRange.end || sortBy !== '-sent_at';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SMS Monitoring</h1>
          <p className="text-gray-600 mt-2">Track message delivery and status in real-time</p>
        </div>
        {/* <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div> */}
      </div>

      {/* Status cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{statusCounts.delivered}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending / Sent</p>
              <p className="text-2xl font-bold text-amber-600">{statusCounts.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{statusCounts.failed}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div> */}

      {/* Enhanced Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          {/* Primary filters */}
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages, phone numbers, or accounts..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex flex-wrap items-center space-x-3">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="delivered">Delivered</option>
                <option value="sent">Sent</option>
                <option value="queued">Queued</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={directionFilter}
                onChange={handleDirectionFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Directions</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>

              <select
                value={sortBy}
                onChange={handleSortChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="-sent_at">Latest First</option>
                <option value="sent_at">Oldest First</option>
                <option value="-created_at">Recently Created</option>
                <option value="created_at">Oldest Created</option>
                <option value="status">Status A-Z</option>
                <option value="-status">Status Z-A</option>
                <option value="from_number">From Number A-Z</option>
                <option value="-from_number">From Number Z-A</option>
              </select>

              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>More Filters</span>
              </button>
            </div>
          </div>

          {/* Advanced filters */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date To
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active filters indicator */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center space-x-2">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Status: {statusFilter}
                    </span>
                  )}
                  {directionFilter !== 'all' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      Direction: {directionFilter}
                    </span>
                  )}
                  {dateRange.start && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                      From: {dateRange.start}
                    </span>
                  )}
                  {dateRange.end && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                      To: {dateRange.end}
                    </span>
                  )}
                </div>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Loading messages...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Direction</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From / To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Created At</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Sent At</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {messages.map((message) => (
                    <tr key={message.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {message.direction === 'outbound' ? (
                            <div className="flex items-center space-x-2 text-blue-600">
                              <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              </div>
                              <span className="text-sm font-medium">Out</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 text-green-600">
                              <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                              </div>
                              <span className="text-sm font-medium">In</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="flex items-center space-x-1 text-gray-900">
                            <Phone className="w-3 h-3" />
                            <span>{message.from_number}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-gray-500 mt-1">
                            <span>→</span>
                            <span>{message.to_number}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div 
                          className="text-sm text-gray-900 max-w-xs truncate cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => setSelectedMessage(message)}
                          title="Click to view full message"
                        >
                          {message.message_content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(message.status)}
                          <span className={getStatusBadge(message.status)}>
                            {message.status?.charAt(0).toUpperCase() + message.status?.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{message.location_name || 'N/A'}</div>
                          <div className="text-gray-500">ID: {message.location_id || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(message.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(message.sent_at).toLocaleString()}
                      </td>
                      
                    </tr>
                  ))}
                  {messages.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        {hasActiveFilters ? 'No messages match your filters.' : 'No messages found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="p-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Showing {messages.length} of {totalCount} messages
                </span>
                {hasActiveFilters && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Filtered results
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {/* <select
                  value={pagination.page_size}
                  onChange={(e) => setPagination(prev => ({ ...prev, page_size: parseInt(e.target.value), page: 1 }))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select> */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(data?.previous)}
                    disabled={!data?.previous}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(data?.next)}
                    disabled={!data?.next}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMessage(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Message Details</h2>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Direction and Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {selectedMessage.direction === 'outbound' ? (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium">Outbound</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-green-600">
                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium">Inbound</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedMessage.status)}
                    <span className={getStatusBadge(selectedMessage.status)}>
                      {selectedMessage.status?.charAt(0).toUpperCase() + selectedMessage.status?.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Phone Numbers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                      <Phone className="w-4 h-4" />
                      <span>From</span>
                    </div>
                    <p className="text-base font-medium text-gray-900">{selectedMessage.from_number}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                      <Phone className="w-4 h-4" />
                      <span>To</span>
                    </div>
                    <p className="text-base font-medium text-gray-900">{selectedMessage.to_number}</p>
                  </div>
                </div>

                {/* Message Content */}
                <div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>Message Content</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-base text-gray-900 whitespace-pre-wrap break-words">
                      {selectedMessage.message_content}
                    </p>
                  </div>
                </div>

                {/* Location Information */}
                {selectedMessage.ghl_account && (
                  <div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <User className="w-4 h-4" />
                      <span>Location</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-base font-medium text-gray-900">
                        {selectedMessage.ghl_account.location_name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        ID: {selectedMessage.ghl_account.location_id || 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>Created At</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900">
                        {new Date(selectedMessage.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>Sent At</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900">
                        {new Date(selectedMessage.sent_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Message IDs */}
                <div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Message IDs</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {selectedMessage.ghl_message_id && (
                      <div>
                        <span className="text-xs text-gray-500">HighLevel Message ID:</span>
                        <p className="text-sm font-mono text-gray-900 mt-1 break-all">
                          {selectedMessage.ghl_message_id}
                        </p>
                      </div>
                    )}
                    {selectedMessage.transmit_message_id && (
                      <div>
                        <span className="text-xs text-gray-500">Transmit Message ID:</span>
                        <p className="text-sm font-mono text-gray-900 mt-1 break-all">
                          {selectedMessage.transmit_message_id}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSMonitoring;