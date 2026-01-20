import { EbayItem } from '@/types/ebay';

export async function fetchSellerItems(sellerUsername: string): Promise<EbayItem[]> {
  const url = `https://www.ebay.com/sch/i.html?_ssn=${encodeURIComponent(sellerUsername)}&_sop=10&_ipg=100&_fcid=1&rt=nc&LH_Sold=0&LH_Complete=0`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    return parseEbayListings(html, sellerUsername);
  } catch (error) {
    console.error(`Error fetching items for seller ${sellerUsername}:`, error);
    return [];
  }
}

function parseEbayListings(html: string, seller: string): EbayItem[] {
  const items: EbayItem[] = [];

  // Match item containers - eBay uses s-item class for search results
  const itemRegex = /<li[^>]*class="[^"]*s-item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  const matches = html.matchAll(itemRegex);

  for (const match of matches) {
    const itemHtml = match[1];

    // Skip placeholder items
    if (itemHtml.includes('s-item__pl-on-bottom')) continue;

    // Extract item ID from link
    const itemIdMatch = itemHtml.match(/\/itm\/(\d+)/);
    const itemId = itemIdMatch?.[1];
    if (!itemId) continue;

    // Extract title
    const titleMatch = itemHtml.match(/<span[^>]*role="heading"[^>]*>([^<]+)<\/span>/i) ||
                       itemHtml.match(/<div[^>]*class="[^"]*s-item__title[^"]*"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i);
    const title = titleMatch?.[1]?.trim() || 'Unknown Item';

    // Skip if it's a "Shop on eBay" placeholder
    if (title === 'Shop on eBay' || title.toLowerCase().includes('shop on ebay')) continue;

    // Extract price
    const priceMatch = itemHtml.match(/<span[^>]*class="[^"]*s-item__price[^"]*"[^>]*>\s*\$?([\d,]+\.?\d*)/i);
    const priceValue = priceMatch?.[1]?.replace(',', '') || '0.00';

    // Extract image
    const imageMatch = itemHtml.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
    let image = imageMatch?.[1] || '';
    // Get higher resolution image
    if (image.includes('thumbs')) {
      image = image.replace(/\/thumbs\//, '/images/').replace(/s-l\d+/, 's-l500');
    }

    // Extract item URL
    const urlMatch = itemHtml.match(/href="(https:\/\/www\.ebay\.com\/itm\/[^"]+)"/i);
    const itemUrl = urlMatch?.[1]?.split('?')[0] || `https://www.ebay.com/itm/${itemId}`;

    // Extract condition
    const conditionMatch = itemHtml.match(/<span[^>]*class="[^"]*SECONDARY_INFO[^"]*"[^>]*>([^<]+)<\/span>/i);
    const condition = conditionMatch?.[1]?.trim();

    // Extract shipping
    const shippingMatch = itemHtml.match(/<span[^>]*class="[^"]*s-item__shipping[^"]*"[^>]*>([^<]*(?:shipping|Free))/i);
    const shippingCost = shippingMatch?.[1]?.trim();

    // Check for auction vs buy it now
    const isAuction = itemHtml.includes('s-item__bids') || itemHtml.includes('bid');
    const hasBuyItNow = itemHtml.includes('Buy It Now');

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
    const timeMatch = itemHtml.match(/(\d+[dhms]\s*\d*[dhms]?)\s*left/i);
    const timeLeft = timeMatch?.[1];

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

export async function fetchAllSellersItems(sellerUsernames: string[]): Promise<EbayItem[]> {
  const results = await Promise.all(
    sellerUsernames.map(username => fetchSellerItems(username))
  );
  return results.flat();
}
