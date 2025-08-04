import React from 'react';
import { 
  Activity, 
  MessageSquare, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import MetricCard from './ui/MetricCard';
import StatusIndicator from './ui/StatusIndicator';

const Dashboard = () => {
  const metrics = [
    {
      title: 'Messages Today',
      value: '12,847',
      change: '+12.5%',
      trend: 'up',
      icon: MessageSquare,
      color: 'blue'
    },
    {
      title: 'Active Accounts',
      value: '284',
      change: '+3.2%',
      trend: 'up',
      icon: Users,
      color: 'green'
    },
    {
      title: 'Success Rate',
      value: '98.7%',
      change: '+0.8%',
      trend: 'up',
      icon: TrendingUp,
      color: 'indigo'
    },
    {
      title: 'Avg Response Time',
      value: '142ms',
      change: '-8.3%',
      trend: 'down',
      icon: Zap,
      color: 'amber'
    }
  ];

  const recentActivity = [
    { id: 1, type: 'success', message: 'SMS sent successfully to +1234567890', time: '2 minutes ago' },
    { id: 2, type: 'warning', message: 'Rate limit approaching for account ACC_001', time: '5 minutes ago' },
    { id: 3, type: 'success', message: 'New account mapping created: HL_002 → TR_045', time: '12 minutes ago' },
    { id: 4, type: 'error', message: 'Failed to deliver SMS to +1987654321', time: '18 minutes ago' },
    { id: 5, type: 'success', message: 'Webhook configuration updated successfully', time: '25 minutes ago' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your SMS routing system performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <StatusIndicator status="operational" label="System Status" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Refresh Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">All Systems Operational</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">HighLevel API</span>
              </div>
              <span className="text-sm text-green-600">Connected</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Transmit SMS API</span>
              </div>
              <span className="text-sm text-green-600">Connected</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-gray-900">Rate Limiter</span>
              </div>
              <span className="text-sm text-amber-600">85% Capacity</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Database</span>
              </div>
              <span className="text-sm text-green-600">Healthy</span>
            </div>
          </div>
        </div> */}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex-shrink-0 mt-0.5">
                  {activity.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {activity.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                  {activity.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;