'use client';

import { SellerInfo } from '@/types/ebay';

interface SellerTabsProps {
  sellers: SellerInfo[];
  activeSeller: string | null;
  onSellerChange: (seller: string | null) => void;
  itemCounts?: Record<string, number>;
}

export default function SellerTabs({
  sellers,
  activeSeller,
  onSellerChange,
  itemCounts,
}: SellerTabsProps) {
  const totalItems = itemCounts
    ? Object.values(itemCounts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSellerChange(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          activeSeller === null
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
        }`}
      >
        All Sellers
        {itemCounts && (
          <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
            {totalItems}
          </span>
        )}
      </button>
      {sellers.map((seller) => (
        <button
          key={seller.username}
          onClick={() => onSellerChange(seller.username)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            activeSeller === seller.username
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          {seller.displayName}
          {itemCounts && itemCounts[seller.username] !== undefined && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
              {itemCounts[seller.username]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
