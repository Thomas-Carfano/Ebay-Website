export interface EbayItem {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  image: string;
  itemUrl: string;
  condition?: string;
  seller: string;
  shippingCost?: string;
  bidsCount?: number;
  timeLeft?: string;
  listingType?: 'auction' | 'buyItNow' | 'both';
}

export interface SellerInfo {
  username: string;
  displayName: string;
}

export const SELLERS: SellerInfo[] = [
  { username: 'thomastsc', displayName: 'ThomasTSC' },
  { username: 'cventuresllc', displayName: 'C Ventures LLC' },
];
