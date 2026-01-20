import EbayListings from '@/components/EbayListings';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🛒</div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                  My eBay Listings
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Browse items from our stores
                </p>
              </div>
            </div>
            <a
              href="https://www.ebay.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V11H19V6.413L11.2071 14.2071L9.79289 12.7929L17.585 5H13V3H21Z" />
              </svg>
              Visit eBay
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EbayListings />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Items listed on eBay. Prices and availability subject to change.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.ebay.com/usr/thomastsc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                ThomasTSC on eBay
              </a>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <a
                href="https://www.ebay.com/usr/cventuresllc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                C Ventures LLC on eBay
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
