'use client';

import Image from 'next/image';
import { EbayItem } from '@/types/ebay';

interface ItemCardProps {
  item: EbayItem;
}

export default function ItemCard({ item }: ItemCardProps) {
  const formatPrice = (value: string, currency: string) => {
    const num = parseFloat(value);
    if (currency === 'USD') {
      return `$${num.toFixed(2)}`;
    }
    return `${num.toFixed(2)} ${currency}`;
  };

  return (
    <a
      href={item.itemUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white dark:bg-zinc-900 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500"
    >
      <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            No Image
          </div>
        )}
        {item.listingType === 'auction' && (
          <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            Auction
          </span>
        )}
        {item.listingType === 'both' && (
          <span className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            Auction + BIN
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 min-h-[2.5rem] text-sm leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {item.title}
        </h3>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl font-bold text-zinc-900 dark:text-white">
            {formatPrice(item.price.value, item.price.currency)}
          </span>
          {item.bidsCount !== undefined && item.bidsCount > 0 && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {item.bidsCount} bid{item.bidsCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {item.shippingCost && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {item.shippingCost.toLowerCase().includes('free') ? (
              <span className="text-green-600 dark:text-green-400 font-medium">Free shipping</span>
            ) : (
              `+${item.shippingCost}`
            )}
          </p>
        )}

        {item.condition && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {item.condition}
          </p>
        )}

        {item.timeLeft && (
          <p className="mt-2 text-xs font-medium text-orange-600 dark:text-orange-400">
            {item.timeLeft} left
          </p>
        )}

        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Seller: {item.seller}
          </span>
        </div>
      </div>
    </a>
  );
}
