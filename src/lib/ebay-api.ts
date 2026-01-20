import { EbayItem } from '@/types/ebay';

// eBay Browse API integration
// Requires EBAY_APP_ID and EBAY_CERT_ID environment variables
// Get these from https://developer.ebay.com/

interface EbayApiItem {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  image?: {
    imageUrl: string;
  };
  itemWebUrl: string;
  condition?: string;
  seller: {
    username: string;
  };
  shippingOptions?: Array<{
    shippingCost?: {
      value: string;
      currency: string;
    };
    type: string;
  }>;
  currentBidPrice?: {
    value: string;
    currency: string;
  };
  bidCount?: number;
  itemEndDate?: string;
  buyingOptions?: string[];
}

interface EbaySearchResponse {
  itemSummaries?: EbayApiItem[];
  total: number;
  warnings?: Array<{ message: string }>;
}

let cachedToken: { token: string; expires: number } | null = null;

async function getOAuthToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expires > Date.now()) {
    return cachedToken.token;
  }

  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;

  if (!appId || !certId) {
    throw new Error('eBay API credentials not configured. Set EBAY_APP_ID and EBAY_CERT_ID environment variables.');
  }

  const credentials = Buffer.from(`${appId}:${certId}`).toString('base64');

  const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('eBay OAuth error:', error);
    throw new Error(`Failed to get eBay OAuth token: ${response.status}`);
  }

  const data = await response.json();

  // Cache the token (expires_in is in seconds, subtract 60 for safety margin)
  cachedToken = {
    token: data.access_token,
    expires: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

export async function fetchSellerItemsFromApi(sellerUsername: string): Promise<EbayItem[]> {
  try {
    const token = await getOAuthToken();

    // Use the Browse API to search for items by seller
    const searchParams = new URLSearchParams({
      q: `seller:${sellerUsername}`,
      limit: '100',
      sort: 'newlyListed',
    });

    const response = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?${searchParams}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`eBay API error for seller ${sellerUsername}:`, error);
      return [];
    }

    const data: EbaySearchResponse = await response.json();

    if (!data.itemSummaries) {
      return [];
    }

    return data.itemSummaries.map((item): EbayItem => {
      const isAuction = item.buyingOptions?.includes('AUCTION');
      const hasBuyItNow = item.buyingOptions?.includes('FIXED_PRICE') || item.buyingOptions?.includes('BEST_OFFER');

      let listingType: 'auction' | 'buyItNow' | 'both' = 'buyItNow';
      if (isAuction && hasBuyItNow) {
        listingType = 'both';
      } else if (isAuction) {
        listingType = 'auction';
      }

      // Calculate time left if there's an end date
      let timeLeft: string | undefined;
      if (item.itemEndDate) {
        const endDate = new Date(item.itemEndDate);
        const now = new Date();
        const diff = endDate.getTime() - now.getTime();
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          if (days > 0) {
            timeLeft = `${days}d ${hours}h`;
          } else {
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            timeLeft = `${hours}h ${minutes}m`;
          }
        }
      }

      // Get shipping info
      let shippingCost: string | undefined;
      if (item.shippingOptions && item.shippingOptions.length > 0) {
        const shipping = item.shippingOptions[0];
        if (shipping.shippingCost) {
          const cost = parseFloat(shipping.shippingCost.value);
          shippingCost = cost === 0 ? 'Free shipping' : `$${cost.toFixed(2)} shipping`;
        } else if (shipping.type === 'FREE') {
          shippingCost = 'Free shipping';
        }
      }

      return {
        itemId: item.itemId,
        title: item.title,
        price: {
          value: item.currentBidPrice?.value || item.price.value,
          currency: item.price.currency,
        },
        image: item.image?.imageUrl || '',
        itemUrl: item.itemWebUrl,
        condition: item.condition,
        seller: sellerUsername,
        shippingCost,
        bidsCount: item.bidCount,
        timeLeft,
        listingType,
      };
    });
  } catch (error) {
    console.error(`Error fetching items for seller ${sellerUsername}:`, error);
    return [];
  }
}

export async function fetchAllSellersItemsFromApi(sellerUsernames: string[]): Promise<EbayItem[]> {
  const results = await Promise.all(
    sellerUsernames.map(username => fetchSellerItemsFromApi(username))
  );
  return results.flat();
}

// Check if eBay API is configured
export function isEbayApiConfigured(): boolean {
  return !!(process.env.EBAY_APP_ID && process.env.EBAY_CERT_ID);
}
