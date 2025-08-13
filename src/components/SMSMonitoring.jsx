import React, { useState, useMemo } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { useGetMessagesApiQuery } from '../store/api/messagesApi';

const SMSMonitoring = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageUrl, setPageUrl] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, page_size: 10 });


  const { data, isLoading, isFetching, refetch } = useGetMessagesApiQuery(pagination);

  const messages = data?.results || [];
  const totalCount = data?.count || 0;
  // const totalPages = Math.ceil(totalCount / pagination.page_size);

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

  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      const matchesSearch =
        message.from_number?.includes(searchTerm) ||
        message.to_number?.includes(searchTerm) ||
        message.message_content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.ghl_account?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [messages, searchTerm, statusFilter]);

  const statusCounts = useMemo(() => ({
    all: messages.length,
    delivered: messages.filter(m => m.status === 'delivered').length,
    pending: messages.filter(m => m.status === 'pending' || m.status === 'sent').length,
    failed: messages.filter(m => m.status === 'failed').length
  }), [messages]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SMS Monitoring</h1>
          <p className="text-gray-600 mt-2">Track message delivery and status in real-time</p>
        </div>
        <div className="flex items-center space-x-3">
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
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* Messages table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages, phone numbers, or accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="delivered">Delivered</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Loading messages...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From / To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message IDs</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMessages.map((message) => (
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
                        <div className="text-sm text-gray-900 max-w-xs truncate">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {message.ghl_account?.location_name}
                        {/* <br />
                        {message.ghl_account?.id} */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(message.sent_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs">
                          <div className="text-gray-900 font-mono">{message.ghl_message_id}</div>
                          <div className="text-gray-500 font-mono mt-1">{message.transmit_message_id}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredMessages.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        No messages found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="p-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(data?.previous)}
                  disabled={!data?.previous}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(data?.next)}
                  disabled={!data?.next}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SMSMonitoring;
