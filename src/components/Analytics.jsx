import React, { useState } from 'react';
import { 
  TrendingUp, 
  MessageSquare, 
  Clock, 
  DollarSign,
  Calendar
} from 'lucide-react';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');

  const chartData = [
    { date: '2024-01-09', sent: 1200, delivered: 1150, failed: 50 },
    { date: '2024-01-10', sent: 1350, delivered: 1280, failed: 70 },
    { date: '2024-01-11', sent: 1100, delivered: 1050, failed: 50 },
    { date: '2024-01-12', sent: 1450, delivered: 1400, failed: 50 },
    { date: '2024-01-13', sent: 1600, delivered: 1520, failed: 80 },
    { date: '2024-01-14', sent: 1300, delivered: 1250, failed: 50 },
    { date: '2024-01-15', sent: 1750, delivered: 1700, failed: 50 }
  ];

  const totalSent = chartData.reduce((sum, day) => sum + day.sent, 0);
  const totalDelivered = chartData.reduce((sum, day) => sum + day.delivered, 0);
  const totalFailed = chartData.reduce((sum, day) => sum + day.failed, 0);
  const deliveryRate = ((totalDelivered / totalSent) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Track SMS performance and system metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+12.5%</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{totalSent.toLocaleString()}</h3>
            <p className="text-gray-600 text-sm mt-1">Messages Sent</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+8.2%</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{deliveryRate}%</h3>
            <p className="text-gray-600 text-sm mt-1">Delivery Rate</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex items-center space-x-1 text-red-600">
              <TrendingUp className="w-4 h-4 rotate-180" />
              <span className="text-sm font-medium">-5.1%</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">142ms</h3>
            <p className="text-gray-600 text-sm mt-1">Avg Response Time</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+24.8%</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">$1,247</h3>
            <p className="text-gray-600 text-sm mt-1">Cost Savings</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Message Volume Trend</h2>
          <div className="space-y-4">
            {chartData.map((day, index) => {
              const maxValue = Math.max(...chartData.map(d => d.sent));
              const sentWidth = (day.sent / maxValue) * 100;
              const deliveredWidth = (day.delivered / maxValue) * 100;
              
              return (
                <div key={day.date} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-gray-500">{day.sent} sent</span>
                      <span className="text-xs text-green-600">{day.delivered} delivered</span>
                      <span className="text-xs text-red-600">{day.failed} failed</span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gray-400 h-2 rounded-full" 
                        style={{ width: `${sentWidth}%` }}
                      ></div>
                    </div>
                    <div 
                      className="absolute top-0 bg-green-500 h-2 rounded-full" 
                      style={{ width: `${deliveredWidth}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Performing Accounts</h2>
          <div className="space-y-4">
            {[
              { name: 'Digital Solutions', messages: 2156, rate: 99.2, growth: '+15%' },
              { name: 'Gracify Media', messages: 1889, rate: 98.7, growth: '+8%' },
              { name: 'Life.fm', messages: 1247, rate: 97.8, growth: '+22%' },
              { name: 'Marketing Pro', messages: 892, rate: 96.5, growth: '+5%' },
              { name: 'Tech Startup', messages: 654, rate: 98.1, growth: '+31%' }
            ].map((account, index) => (
              <div key={account.name} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{account.name}</div>
                    <div className="text-sm text-gray-500">{account.messages} messages</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{account.rate}%</div>
                  <div className="text-xs text-green-600">{account.growth}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Cost Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">$0.0095</div>
            <div className="text-sm text-gray-600 mt-1">Transmit SMS Cost per Message</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">$0.0175</div>
            <div className="text-sm text-gray-600 mt-1">Previous Twilio Cost per Message</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">45.7%</div>
            <div className="text-sm text-gray-600 mt-1">Cost Reduction</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;