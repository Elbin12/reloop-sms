import React, { useState } from 'react';
import { 
  Activity, 
  MessageSquare, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Filter,
  ArrowUpDown,
  Calendar,
  DollarSign,
  Send,
  MessageCircle,
  PhoneCall
} from 'lucide-react';
import { useGetDashboardApiQuery } from '../store/api/dashboardApi';

// MetricCard component
const MetricCard = ({ title, value, change, trend, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    indigo: 'text-indigo-600 bg-indigo-100',
    amber: 'text-amber-600 bg-amber-100',
    red: 'text-red-600 bg-red-100',
    purple: 'text-purple-600 bg-purple-100'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {change && (
        <div className="flex items-center mt-4">
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change}
          </span>
          <span className="text-sm text-gray-600 ml-2">vs last period</span>
        </div>
      )}
    </div>
  );
};

// StatusIndicator component
const StatusIndicator = ({ status, label }) => {
  const statusConfig = {
    operational: { color: 'green', text: 'Operational' },
    warning: { color: 'amber', text: 'Warning' },
    error: { color: 'red', text: 'Error' }
  };

  const config = statusConfig[status] || statusConfig.operational;

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 bg-${config.color}-500 rounded-full animate-pulse`}></div>
      <span className={`text-sm text-${config.color}-600 font-medium`}>
        {label}: {config.text}
      </span>
    </div>
  );
};

const Dashboard = () => {
  const [filters, setFilters] = useState({
    days: 30,
    account_name: ''
  });
  
  const [messageSortBy, setMessageSortBy] = useState('created_at');
  const [messageSortOrder, setMessageSortOrder] = useState('desc');

  // API query with filters
  const { 
    data: dashboardData, 
    isLoading, 
    isFetching, 
    refetch 
  } = useGetDashboardApiQuery({
    days: filters.days,
    ...(filters.account_name && { account_name: filters.account_name })
  });

  const data = dashboardData?.data;
  const recentMessages = dashboardData?.recent_messages || [];
  const dateRange = dashboardData?.date_range;

  // Create metrics from API data
  const metrics = data ? [
    {
      title: 'Total Messages',
      value: data.total_messages.toLocaleString(),
      change: `${data.recent_messages_24h} today`,
      trend: 'up',
      icon: MessageSquare,
      color: 'blue'
    },
    {
      title: 'Delivery Rate',
      value: `${data.delivery_rate}%`,
      change: `${data.delivered_messages}/${data.total_messages}`,
      trend: data.delivery_rate > 90 ? 'up' : 'down',
      icon: TrendingUp,
      color: data.delivery_rate > 90 ? 'green' : 'amber'
    },
    {
      title: 'Total Balance',
      value: `$${data.total_balance}`,
      change: `$${data.total_spent} spent`,
      trend: 'up',
      icon: DollarSign,
      color: 'indigo'
    },
    {
      title: 'Active Mappings',
      value: data.active_mappings.toString(),
      change: `${data.total_accounts} accounts`,
      trend: 'up',
      icon: Users,
      color: 'purple'
    }
  ] : [];

  // Sort messages
  const sortedMessages = [...recentMessages].sort((a, b) => {
    const aValue = a[messageSortBy];
    const bValue = b[messageSortBy];
    
    if (messageSortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'queued':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDirectionIcon = (direction) => {
    return direction === 'inbound' ? 
      <MessageCircle className="w-4 h-4 text-blue-500" /> : 
      <Send className="w-4 h-4 text-green-500" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor your SMS routing system performance
            {dateRange && (
              <span className="ml-2 text-sm">
                ({dateRange.start_date} to {dateRange.end_date})
              </span>
            )}
          </p>
        </div>
        {/* <div className="flex items-center space-x-4">
          <StatusIndicator 
            status={data?.delivery_rate > 90 ? 'operational' : 'warning'} 
            label="System Status" 
          />
          <button 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isFetching ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div> */}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period (Days)
            </label>
            <select
              value={filters.days}
              onChange={(e) => handleFilterChange('days', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name
            </label>
            <input
              type="text"
              value={filters.account_name}
              onChange={(e) => handleFilterChange('account_name', e.target.value)}
              placeholder="Enter account ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => refetch()}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Distribution</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Outbound Messages</span>
              <span className="font-semibold">{data?.outbound_messages}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Inbound Messages</span>
              <span className="font-semibold">{data?.inbound_messages}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Failed Messages</span>
              <span className="font-semibold text-red-600">{data?.failed_messages}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Message Cost</span>
              <span className="font-semibold">${data?.avg_message_cost}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Spent</span>
              <span className="font-semibold">${data?.total_spent}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Remaining Balance</span>
              <span className="font-semibold text-green-600">${data?.total_balance}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Messages (24h)</span>
              <span className="font-semibold">{data?.recent_messages_24h}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Transactions (24h)</span>
              <span className="font-semibold">{data?.recent_transactions_24h}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Accounts</span>
              <span className="font-semibold">{data?.total_accounts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Messages</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <select
                value={messageSortBy}
                onChange={(e) => setMessageSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="created_at">Date</option>
                <option value="status">Status</option>
                <option value="direction">Direction</option>
              </select>
              <select
                value={messageSortOrder}
                onChange={(e) => setMessageSortOrder(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {sortedMessages.length > 0 ? (
            sortedMessages.map((message) => (
              <div key={message.id} className="flex items-start space-x-3 p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                <div className="flex items-center space-x-2">
                  {getDirectionIcon(message.direction)}
                  {getStatusIcon(message.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {message.direction === 'inbound' ? 'From' : 'To'}: {message.direction === 'inbound' ? message.from_number : message.to_number}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      message.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      message.status === 'queued' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {message.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{message.message_content}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(message.created_at).toLocaleString()} • 
                    <span className="ml-1 capitalize">{message.direction}</span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent messages found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;