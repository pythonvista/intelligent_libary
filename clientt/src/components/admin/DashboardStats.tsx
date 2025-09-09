'use client';

import React from 'react';
import { 
  BookOpenIcon, 
  UsersIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface DashboardData {
  overview: {
    totalBooks: number;
    totalUsers: number;
    activeTransactions: number;
    overdueTransactions: number;
    availabilityRate: string;
  };
  activity: {
    thisMonthTransactions: number;
    thisWeekTransactions: number;
  };
}

interface DashboardStatsProps {
  data: DashboardData;
  loading?: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ data, loading = false }) => {
  const stats = [
    {
      name: 'Total Books',
      value: data?.overview?.totalBooks || 0,
      icon: BookOpenIcon,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: 'Active Users',
      value: data?.overview?.totalUsers || 0,
      icon: UsersIcon,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive',
    },
    {
      name: 'Books Borrowed',
      value: data?.overview?.activeTransactions || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      change: '+15%',
      changeType: 'positive',
    },
    {
      name: 'Overdue Books',
      value: data?.overview?.overdueTransactions || 0,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      change: '-3%',
      changeType: 'negative',
    },
  ];

  const activityStats = [
    {
      name: 'This Month',
      value: data?.activity?.thisMonthTransactions || 0,
      description: 'Books borrowed this month',
    },
    {
      name: 'This Week',
      value: data?.activity?.thisWeekTransactions || 0,
      description: 'Books borrowed this week',
    },
    {
      name: 'Availability Rate',
      value: data?.overview?.availabilityRate || '0%',
      description: 'Books currently available',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Main Stats Skeleton */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-300 rounded"></div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Activity Stats Skeleton */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-300 rounded w-16 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-24 mx-auto mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-32 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-2 rounded-md ${item.color}`}>
                    <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {item.value.toLocaleString()}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        item.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Stats */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Library Activity
          </h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {activityStats.map((stat) => (
              <div key={stat.name} className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-sm font-medium text-gray-900">{stat.name}</div>
                <div className="text-xs text-gray-500">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              <BookOpenIcon className="h-4 w-4 mr-2" />
              Add New Book
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              <UsersIcon className="h-4 w-4 mr-2" />
              Manage Users
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
              View Overdue
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Generate Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
