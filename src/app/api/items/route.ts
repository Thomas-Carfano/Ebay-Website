import { NextResponse } from 'next/server';
import { fetchSellerItemsFromApi, fetchAllSellersItemsFromApi, isEbayApiConfigured } from '@/lib/ebay-api';
import { SELLERS } from '@/types/ebay';

export const revalidate = 300; // Revalidate every 5 minutes
export const dynamic = 'force-dynamic'; // Ensure fresh data on each request

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seller = searchParams.get('seller');

  // Check if API is configured
  if (!isEbayApiConfigured()) {
    return NextResponse.json(
      {
        error: 'eBay API not configured',
        message: 'Please set EBAY_APP_ID and EBAY_CERT_ID environment variables in Vercel',
        setupUrl: 'https://developer.ebay.com/',
        items: [],
        count: 0,
      },
      { status: 200 } // Return 200 so the UI can show a helpful message
    );
  }

  try {
    if (seller) {
      // Validate seller is in our list
      const validSeller = SELLERS.find(s => s.username === seller);
      if (!validSeller) {
        return NextResponse.json(
          { error: 'Invalid seller' },
          { status: 400 }
        );
      }

      const items = await fetchSellerItemsFromApi(seller);
      return NextResponse.json({
        items,
        count: items.length,
        timestamp: new Date().toISOString(),
        source: 'ebay-api',
      });
    } else {
      // Fetch all sellers
      const sellerUsernames = SELLERS.map(s => s.username);
      const items = await fetchAllSellersItemsFromApi(sellerUsernames);

      return NextResponse.json({
        items,
        count: items.length,
        timestamp: new Date().toISOString(),
        source: 'ebay-api',
      });
    }
  } catch (error) {
    console.error('Error fetching eBay items:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch items',
        message: error instanceof Error ? error.message : 'Unknown error',
        items: [],
        count: 0,
      },
      { status: 200 } // Return 200 so the UI can handle gracefully
    );
  }
}
