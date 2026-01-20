'use client';

import { EbayItem } from '@/types/ebay';
import ItemCard from './ItemCard';

interface ItemGridProps {
  items: EbayItem[];
  loading?: boolean;
}

export default function ItemGrid({ items, loading }: ItemGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 rounded-lg shadow-md overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-pulse"
          >
            <div className="aspect-square bg-zinc-200 dark:bg-zinc-800" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
              <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          No items found
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400">
          Check back later for new listings!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((item) => (
        <ItemCard key={item.itemId} item={item} />
      ))}
    </div>
  );
}
