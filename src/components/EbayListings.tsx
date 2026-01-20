'use client';

import { useState, useEffect, useMemo } from 'react';
import { EbayItem, SELLERS } from '@/types/ebay';
import ItemGrid from './ItemGrid';
import SellerTabs from './SellerTabs';

type SortOption = 'newest' | 'price-low' | 'price-high' | 'ending-soon';

export default function EbayListings() {
  const [items, setItems] = useState<EbayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSeller, setActiveSeller] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/items');
        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }
        const data = await response.json();
        setItems(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, []);

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const seller of SELLERS) {
      counts[seller.username] = items.filter(
        (item) => item.seller === seller.username
      ).length;
    }
    return counts;
  }, [items]);

  const filteredAndSortedItems = useMemo(() => {
    let result = items;

    // Filter by seller
    if (activeSeller) {
      result = result.filter((item) => item.seller === activeSeller);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) =>
        item.title.toLowerCase().includes(query)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return parseFloat(a.price.value) - parseFloat(b.price.value);
        case 'price-high':
          return parseFloat(b.price.value) - parseFloat(a.price.value);
        case 'ending-soon':
          // Items with timeLeft come first
          if (a.timeLeft && !b.timeLeft) return -1;
          if (!a.timeLeft && b.timeLeft) return 1;
          return 0;
        default:
          return 0; // newest - keep original order
      }
    });

    return result;
  }, [items, activeSeller, sortBy, searchQuery]);

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">😕</div>
        <h3 className="text-xl font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Something went wrong
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <SellerTabs
          sellers={SELLERS}
          activeSeller={activeSeller}
          onSellerChange={setActiveSeller}
          itemCounts={itemCounts}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 pl-10 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="ending-soon">Ending Soon</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      {!loading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Showing {filteredAndSortedItems.length} item
          {filteredAndSortedItems.length !== 1 ? 's' : ''}
          {activeSeller && ` from ${SELLERS.find(s => s.username === activeSeller)?.displayName}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      )}

      {/* Items Grid */}
      <ItemGrid items={filteredAndSortedItems} loading={loading} />
    </div>
  );
}
