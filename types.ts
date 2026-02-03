// Default categories for initialization
export const DEFAULT_CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat',
  'Bakery',
  'Frozen',
  'Pantry',
  'Beverages',
  'Household',
  'Other'
];

export type Category = string;

export type ItemStatus = 'active' | 'history';

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline';

export interface ProductItem {
  id: string;
  name: string;
  description?: string;
  category: Category;
  addedDate: number; // timestamp
  status: ItemStatus;
  quantity: number;
  unit: string;
  barcode?: string;
  imageUrl?: string;
}

export interface ScanResult {
  productName: string;
  description?: string;
  category: Category;
  suggestedExpiryDays: number;
  quantityUnit: string;
  barcode?: string;
  imageUrl?: string;
}

export type ViewState = 'LIST' | 'HISTORY';