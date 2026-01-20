import { NextResponse } from 'next/server';
import { fetchSellerItems, fetchAllSellersItems } from '@/lib/ebay';
import { SELLERS } from '@/types/ebay';

export const revalidate = 300; // Revalidate every 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seller = searchParams.get('seller');

  try {
    let items;

    if (seller) {
      // Validate seller is in our list
      const validSeller = SELLERS.find(s => s.username === seller);
      if (!validSeller) {
        return NextResponse.json(
          { error: 'Invalid seller' },
          { status: 400 }
        );
      }
      items = await fetchSellerItems(seller);
    } else {
      // Fetch all sellers
      const sellerUsernames = SELLERS.map(s => s.username);
      items = await fetchAllSellersItems(sellerUsernames);
    }

    return NextResponse.json({
      items,
      count: items.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching eBay items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}
