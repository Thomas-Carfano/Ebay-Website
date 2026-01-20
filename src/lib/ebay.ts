import { EbayItem } from '@/types/ebay';

export interface FetchResult {
  items: EbayItem[];
  error?: string;
  debug?: {
    url: string;
    status?: number;
    htmlLength?: number;
    parseAttempted: boolean;
  };
}

export async function fetchSellerItems(sellerUsername: string): Promise<FetchResult> {
  const url = `https://www.ebay.com/sch/i.html?_ssn=${encodeURIComponent(sellerUsername)}&_sop=10&_ipg=100&_fcid=1&rt=nc&LH_Sold=0&LH_Complete=0`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      return {
        items: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
        debug: { url, status: response.status, parseAttempted: false },
      };
    }

    const html = await response.text();
    const items = parseEbayListings(html, sellerUsername);

    return {
      items,
      debug: {
        url,
        status: response.status,
        htmlLength: html.length,
        parseAttempted: true,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching items for seller ${sellerUsername}:`, error);
    return {
      items: [],
      error: errorMessage,
      debug: { url, parseAttempted: false },
    };
  }
}

function parseEbayListings(html: string, seller: string): EbayItem[] {
  const items: EbayItem[] = [];

  // Try multiple parsing strategies

  // Strategy 1: Match s-item list items
  const itemRegex = /<li[^>]*class="[^"]*s-item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let matches = [...html.matchAll(itemRegex)];

  // Strategy 2: If no matches, try data-viewport attribute items
  if (matches.length === 0) {
    const altRegex = /<div[^>]*data-viewport[^>]*class="[^"]*s-item[^"]*"[^>]*>([\s\S]*?)<\/div>(?=\s*<div[^>]*data-viewport|\s*<\/ul)/gi;
    matches = [...html.matchAll(altRegex)];
  }

  for (const match of matches) {
    const itemHtml = match[1] || match[0];

    // Skip placeholder items
    if (itemHtml.includes('s-item__pl-on-bottom')) continue;

    // Extract item ID from link - try multiple patterns
    let itemId: string | undefined;
    const itemIdMatch = itemHtml.match(/\/itm\/(\d+)/) ||
                        itemHtml.match(/data-itemid="(\d+)"/) ||
                        itemHtml.match(/iid=(\d+)/);
    itemId = itemIdMatch?.[1];
    if (!itemId) continue;

    // Extract title - try multiple patterns
    const titleMatch = itemHtml.match(/<span[^>]*role="heading"[^>]*>([^<]+)<\/span>/i) ||
                       itemHtml.match(/<div[^>]*class="[^"]*s-item__title[^"]*"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i) ||
                       itemHtml.match(/class="[^"]*s-item__title[^"]*"[^>]*>([^<]+)</i) ||
                       itemHtml.match(/<h3[^>]*>([^<]+)<\/h3>/i);
    const title = titleMatch?.[1]?.trim() || 'Unknown Item';

    // Skip if it's a "Shop on eBay" placeholder
    if (title === 'Shop on eBay' || title.toLowerCase().includes('shop on ebay')) continue;

    // Extract price - try multiple patterns
    const priceMatch = itemHtml.match(/<span[^>]*class="[^"]*s-item__price[^"]*"[^>]*>\s*\$?([\d,]+\.?\d*)/i) ||
                       itemHtml.match(/\$\s*([\d,]+\.?\d*)/);
    const priceValue = priceMatch?.[1]?.replace(/,/g, '') || '0.00';

    // Extract image - try multiple patterns
    const imageMatch = itemHtml.match(/data-src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i) ||
                       itemHtml.match(/<img[^>]*src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i) ||
                       itemHtml.match(/<img[^>]*src="([^"]+ebayimg[^"]+)"/i);
    let image = imageMatch?.[1] || '';

    // Get higher resolution image
    if (image) {
      image = image.replace(/s-l\d+/, 's-l500').replace(/\/thumbs\//, '/images/');
    }

    // Extract item URL
    const urlMatch = itemHtml.match(/href="(https:\/\/www\.ebay\.com\/itm\/[^"?]+)/i) ||
                     itemHtml.match(/href="([^"]*\/itm\/\d+)/i);
    let itemUrl = urlMatch?.[1] || `https://www.ebay.com/itm/${itemId}`;
    if (!itemUrl.startsWith('http')) {
      itemUrl = `https://www.ebay.com${itemUrl}`;
    }

    // Extract condition
    const conditionMatch = itemHtml.match(/<span[^>]*class="[^"]*SECONDARY_INFO[^"]*"[^>]*>([^<]+)<\/span>/i) ||
                           itemHtml.match(/condition[^>]*>([^<]+)</i);
    const condition = conditionMatch?.[1]?.trim();

    // Extract shipping
    const shippingMatch = itemHtml.match(/<span[^>]*class="[^"]*s-item__shipping[^"]*"[^>]*>([^<]+)</i) ||
                          itemHtml.match(/shipping[^>]*>\s*([^<]*(?:shipping|Free)[^<]*)</i);
    const shippingCost = shippingMatch?.[1]?.trim();

    // Check for auction vs buy it now
    const isAuction = /\bbids?\b/i.test(itemHtml) || itemHtml.includes('s-item__bids');
    const hasBuyItNow = /buy\s*it\s*now/i.test(itemHtml);

    let listingType: 'auction' | 'buyItNow' | 'both' = 'buyItNow';
    if (isAuction && hasBuyItNow) {
      listingType = 'both';
    } else if (isAuction) {
      listingType = 'auction';
    }

    // Extract bids count for auctions
    const bidsMatch = itemHtml.match(/(\d+)\s*bids?/i);
    const bidsCount = bidsMatch ? parseInt(bidsMatch[1], 10) : undefined;

    // Extract time left
    const timeMatch = itemHtml.match(/(\d+[dhms]\s*\d*[dhms]?)\s*left/i) ||
                      itemHtml.match(/Time\s*left[^>]*>([^<]+)/i);
    const timeLeft = timeMatch?.[1]?.trim();

    items.push({
      itemId,
      title,
      price: {
        value: priceValue,
        currency: 'USD',
      },
      image,
      itemUrl,
      condition,
      seller,
      shippingCost,
      bidsCount,
      timeLeft,
      listingType,
    });
  }

  return items;
}

export async function fetchAllSellersItems(sellerUsernames: string[]): Promise<{
  items: EbayItem[];
  errors: Record<string, string>;
  debug: Record<string, FetchResult['debug']>;
}> {
  const results = await Promise.all(
    sellerUsernames.map(username => fetchSellerItems(username))
  );

  const items: EbayItem[] = [];
  const errors: Record<string, string> = {};
  const debug: Record<string, FetchResult['debug']> = {};

  results.forEach((result, index) => {
    const username = sellerUsernames[index];
    items.push(...result.items);
    if (result.error) {
      errors[username] = result.error;
    }
    if (result.debug) {
      debug[username] = result.debug;
    }
  });

  return { items, errors, debug };
}
