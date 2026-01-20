'use client';

import { useState, useEffect, useMemo } from 'react';
import { EbayItem, SELLERS } from '@/types/ebay';
import ItemGrid from './ItemGrid';
import SellerTabs from './SellerTabs';

type SortOption = 'newest' | 'price-low' | 'price-high' | 'ending-soon';

interface ApiResponse {
  items: EbayItem[];
  count: number;
  error?: string;
  message?: string;
  setupUrl?: string;
}

export default function EbayListings() {
  const [items, setItems] = useState<EbayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [activeSeller, setActiveSeller] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      setError(null);
      setSetupRequired(false);

      try {
        const response = await fetch('/api/items');
        const data: ApiResponse = await response.json();

        if (data.error === 'eBay API not configured') {
          setSetupRequired(true);
          setItems([]);
        } else if (data.error) {
          setError(data.message || data.error);
          setItems([]);
        } else {
          setItems(data.items || []);
        }
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
          if (a.timeLeft && !b.timeLeft) return -1;
          if (!a.timeLeft && b.timeLeft) return 1;
          return 0;
        default:
          return 0;
      }
    });

    return result;
  }, [items, activeSeller, sortBy, searchQuery]);

  // Show setup required message
  if (setupRequired) {
    return (
      <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="text-6xl mb-4">🔑</div>
        <h3 className="text-xl font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          eBay API Setup Required
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-lg mx-auto">
          To display your eBay listings, you need to set up eBay API credentials.
        </p>

        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6 max-w-xl mx-auto text-left mb-6">
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-4">Setup Steps:</h4>
          <ol className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-medium">1</span>
              <span>Go to <a href="https://developer.ebay.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">developer.ebay.com</a> and create a free account</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-medium">2</span>
              <span>Create an Application and get your <strong>App ID (Client ID)</strong> and <strong>Cert ID (Client Secret)</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-medium">3</span>
              <span>In your Vercel project settings, add these environment variables:</span>
            </li>
          </ol>

          <div className="mt-4 bg-zinc-900 dark:bg-zinc-950 rounded p-3 font-mono text-sm text-zinc-300">
            <div>EBAY_APP_ID=your_app_id_here</div>
            <div>EBAY_CERT_ID=your_cert_id_here</div>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            After adding the variables, redeploy your site for the changes to take effect.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            In the meantime, view items directly on eBay:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {SELLERS.map((seller) => (
              <a
                key={seller.username}
                href={`https://www.ebay.com/sch/i.html?_ssn=${seller.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                {seller.displayName}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V11H19V6.413L11.2071 14.2071L9.79289 12.7929L17.585 5H13V3H21Z" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

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

  // Show empty state when no items found (but API is configured)
  if (!loading && items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <SellerTabs
            sellers={SELLERS}
            activeSeller={activeSeller}
            onSellerChange={setActiveSeller}
            itemCounts={itemCounts}
          />
        </div>

        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            No active listings found
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-md mx-auto">
            There are currently no active listings from your eBay accounts, or check that your seller usernames are correct.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {SELLERS.map((seller) => (
              <a
                key={seller.username}
                href={`https://www.ebay.com/sch/i.html?_ssn=${seller.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                View {seller.displayName} on eBay
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V11H19V6.413L11.2071 14.2071L9.79289 12.7929L17.585 5H13V3H21Z" />
                </svg>
              </a>
            ))}
          </div>
        </div>
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
