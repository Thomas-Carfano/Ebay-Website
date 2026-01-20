import { NextResponse } from 'next/server';
import { fetchSellerItems, fetchAllSellersItems } from '@/lib/ebay';
import { SELLERS } from '@/types/ebay';

export const revalidate = 300; // Revalidate every 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seller = searchParams.get('seller');
  const debug = searchParams.get('debug') === 'true';

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
      const result = await fetchSellerItems(seller);
      return NextResponse.json({
        items: result.items,
        count: result.items.length,
        timestamp: new Date().toISOString(),
        ...(debug && { debug: result.debug, error: result.error }),
      });
    } else {
      // Fetch all sellers
      const sellerUsernames = SELLERS.map(s => s.username);
      const result = await fetchAllSellersItems(sellerUsernames);

      return NextResponse.json({
        items: result.items,
        count: result.items.length,
        timestamp: new Date().toISOString(),
        ...(debug && { debug: result.debug, errors: result.errors }),
      });
    }
  } catch (error) {
    console.error('Error fetching eBay items:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch items',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
