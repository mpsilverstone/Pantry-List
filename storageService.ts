import { ProductItem, ScanResult, DEFAULT_CATEGORIES } from '../types';

const ITEMS_KEY = 'pantryai_items_v2';
const KNOWN_PRODUCTS_KEY = 'pantryai_known_products';
const CATEGORIES_KEY = 'pantryai_categories_v1';
const SYNC_CODE_KEY = 'pantryai_sync_code';

const SYNC_API_BASE = 'https://api.keyvalue.xyz/6e885098';

// Maintenance Constants
const PHOTO_PRUNE_MS = 180 * 24 * 60 * 60 * 1000; // 6 months
const RECORD_DELETE_MS = 547 * 24 * 60 * 60 * 1000; // 1.5 years
const MAX_HISTORY_SYNC = 100; // Keep cloud payload small

export const storageService = {
  getSyncCode: (): string | null => {
    return localStorage.getItem(SYNC_CODE_KEY);
  },

  setSyncCode: (code: string | null) => {
    if (code) localStorage.setItem(SYNC_CODE_KEY, code);
    else localStorage.removeItem(SYNC_CODE_KEY);
  },

  getItems: (): ProductItem[] => {
    try {
      const data = localStorage.getItem(ITEMS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveItems: (items: ProductItem[]) => {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  },

  /**
   * Auto-Maintenance: Keeps the app fast by pruning old heavy data.
   */
  runMaintenance: (items: ProductItem[]): ProductItem[] => {
    const now = Date.now();
    let prunedCount = 0;
    let deletedCount = 0;

    const maintainedItems = items.filter(item => {
      const age = now - item.addedDate;
      
      // Rule 1: Delete entire record if over 1.5 years old
      if (age > RECORD_DELETE_MS) {
        deletedCount++;
        return false;
      }
      return true;
    }).map(item => {
      const age = now - item.addedDate;
      
      // Rule 2: Prune image if history item is over 6 months old
      if (item.status === 'history' && item.imageUrl && age > PHOTO_PRUNE_MS) {
        prunedCount++;
        return { ...item, imageUrl: undefined };
      }
      return item;
    });

    if (deletedCount > 0 || prunedCount > 0) {
      console.log(`Maintenance complete: ${deletedCount} records deleted, ${prunedCount} images pruned.`);
      storageService.saveItems(maintainedItems);
    }

    return maintainedItems;
  },

  pullFromCloud: async (code: string): Promise<ProductItem[] | null> => {
    try {
      const response = await fetch(`${SYNC_API_BASE}/${code}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : null;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  pushToCloud: async (code: string, items: ProductItem[]): Promise<boolean> => {
    try {
      // Optimization: Only push Active items + limited history to keep cloud payload light
      const activeItems = items.filter(i => i.status === 'active');
      const historyItems = items.filter(i => i.status === 'history')
        .sort((a, b) => b.addedDate - a.addedDate)
        .slice(0, MAX_HISTORY_SYNC);
      
      const payload = [...activeItems, ...historyItems];

      const response = await fetch(`${SYNC_API_BASE}/${code}`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  getCategories: (): string[] => {
    try {
      const data = localStorage.getItem(CATEGORIES_KEY);
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories: (categories: string[]) => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  },

  getKnownProduct: (barcode: string): ScanResult | null => {
    try {
      const data = localStorage.getItem(KNOWN_PRODUCTS_KEY);
      const products = data ? JSON.parse(data) : {};
      return products[barcode] || null;
    } catch (e) {
      return null;
    }
  },

  saveKnownProduct: (result: ScanResult) => {
    if (!result.barcode) return;
    try {
      const data = localStorage.getItem(KNOWN_PRODUCTS_KEY);
      const products = data ? JSON.parse(data) : {};
      products[result.barcode] = result;
      localStorage.setItem(KNOWN_PRODUCTS_KEY, JSON.stringify(products));
    } catch (e) {
      console.error("Failed to save known product", e);
    }
  }
};