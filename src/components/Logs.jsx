import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

const Logs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const logs = [
    {
      id: 1,
      timestamp: '2024-01-15 14:32:15',
      level: 'info',
      component: 'HL-Outbound',
      message: 'SMS sent successfully via Transmit API',
      details: { messageId: 'msg_001', from: '+1-555-0123', status: 'delivered' }
    },
    {
      id: 2,
      timestamp: '2024-01-15 14:31:45',
      level: 'warning',
      component: 'Rate-Limiter',
      message: 'Approaching rate limit threshold (85/100)',
      details: { currentRate: 85, maxRate: 100, windowStart: '14:31:40' }
    },
    {
      id: 3,
      timestamp: '2024-01-15 14:30:22',
      level: 'error',
      component: 'Transmit-API',
      message: 'Failed to deliver SMS - invalid phone number format',
      details: { messageId: 'msg_002', error: 'INVALID_PHONE_FORMAT', phone: '+1-invalid' }
    },
    {
      id: 4,
      timestamp: '2024-01-15 14:29:18',
      level: 'info',
      component: 'Account-Mapper',
      message: 'New account mapping created successfully',
      details: { hlAccount: 'Digital Solutions', transmitAccount: 'TR_067' }
    },
    {
      id: 5,
      timestamp: '2024-01-15 14:28:55',
      level: 'info',
      component: 'Webhook-Handler',
      message: 'Received status update from Transmit SMS',
      details: { messageId: 'msg_003', status: 'delivered', timestamp: '14:28:52' }
    },
    {
      id: 6,
      timestamp: '2024-01-15 14:27:33',
      level: 'error',
      component: 'HL-API',
      message: 'Failed to update message status in HighLevel',
      details: { messageId: 'msg_004', error: 'API_RATE_LIMIT_EXCEEDED', retryAfter: 10 }
    },
    {
      id: 7,
      timestamp: '2024-01-15 14:26:12',
      level: 'info',
      component: 'Reply-Handler',
      message: 'Inbound SMS reply processed and forwarded to HL',
      details: { from: '+1-234-567-8900', conversationId: 'conv_123' }
    }
  ];

  const getLogIcon = (level) => {
    switch (level) {
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLogBadge = (level) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (level) {
      case 'info':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'warning':
        return `${baseClasses} bg-amber-100 text-amber-800`;
      case 'error':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  const logCounts = {
    all: logs.length,
    info: logs.filter(l => l.level === 'info').length,
    warning: logs.filter(l => l.level === 'warning').length,
    error: logs.filter(l => l.level === 'error').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logs & Troubleshooting</h1>
          <p className="text-gray-600 mt-2">Monitor system events and debug issues</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Logs</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{logCounts.all}</p>
            </div>
            <Clock className="w-8 h-8 text-gray-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Info</p>
              <p className="text-2xl font-bold text-blue-600">{logCounts.info}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Warnings</p>
              <p className="text-2xl font-bold text-amber-600">{logCounts.warning}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-red-600">{logCounts.error}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
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
                placeholder="Search logs, components, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {getLogIcon(log.level)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className={getLogBadge(log.level)}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{log.component}</span>
                    </div>
                    <span className="text-sm text-gray-500">{log.timestamp}</span>
                  </div>
                  <p className="text-gray-900 mb-2">{log.message}</p>
                  {log.details && (
                    <div className="bg-gray-50 rounded-lg p-3 mt-2">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Logs;