import React from 'react';

const StatusIndicator = ({ status, label }) => {
  const statusConfig = {
    operational: {
      color: 'bg-green-500',
      text: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    warning: {
      color: 'bg-amber-500',
      text: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    error: {
      color: 'bg-red-500',
      text: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${config.bgColor}`}>
      <div className={`w-2 h-2 rounded-full ${config.color} animate-pulse`}></div>
      <span className={`text-sm font-medium ${config.text}`}>{label}</span>
    </div>
  );
};

export default StatusIndicator;