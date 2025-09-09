'use client';

import React, { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import clsx from 'clsx';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: { subject?: string; sortBy?: string; sortOrder?: string }) => void;
  subjects?: string[];
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onFilterChange,
  subjects = [],
  placeholder = "Search books by title, author, or subject..."
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    onFilterChange({ subject, sortBy, sortOrder });
  };

  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    onFilterChange({ subject: selectedSubject, sortBy: newSortBy, sortOrder: newSortOrder });
  };

  const sortOptions = [
    { label: 'Newest First', value: 'createdAt', order: 'desc' },
    { label: 'Oldest First', value: 'createdAt', order: 'asc' },
    { label: 'Title A-Z', value: 'title', order: 'asc' },
    { label: 'Title Z-A', value: 'title', order: 'desc' },
    { label: 'Author A-Z', value: 'author', order: 'asc' },
    { label: 'Author Z-A', value: 'author', order: 'desc' },
    { label: 'Most Popular', value: 'borrowCount', order: 'desc' },
    { label: 'Highest Rated', value: 'rating.average', order: 'desc' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Subject Filter */}
          {subjects.length > 0 && (
            <Menu as="div" className="relative">
              <Menu.Button className="inline-flex items-center justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                {selectedSubject || 'All Subjects'}
                <FunnelIcon className="ml-2 -mr-1 h-4 w-4" />
              </Menu.Button>

              <Transition
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          className={clsx(
                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                            'block w-full text-left px-4 py-2 text-sm'
                          )}
                          onClick={() => handleSubjectChange('')}
                        >
                          All Subjects
                        </button>
                      )}
                    </Menu.Item>
                    {subjects.map((subject) => (
                      <Menu.Item key={subject}>
                        {({ active }) => (
                          <button
                            type="button"
                            className={clsx(
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                              'block w-full text-left px-4 py-2 text-sm'
                            )}
                            onClick={() => handleSubjectChange(subject)}
                          >
                            {subject}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          )}

          {/* Sort Filter */}
          <Menu as="div" className="relative">
            <Menu.Button className="inline-flex items-center justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Sort by
              <FunnelIcon className="ml-2 -mr-1 h-4 w-4" />
            </Menu.Button>

            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
                  {sortOptions.map((option) => (
                    <Menu.Item key={`${option.value}-${option.order}`}>
                      {({ active }) => (
                        <button
                          type="button"
                          className={clsx(
                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                            'block w-full text-left px-4 py-2 text-sm'
                          )}
                          onClick={() => handleSortChange(option.value, option.order)}
                        >
                          {option.label}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Search Button */}
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
