import { ScanResult, Category } from '../types';
import { storageService } from './storageService';

const mapCategory = (tags: string[] = []): Category => {
  const lowerTags = tags.map(t => t.toLowerCase());
  if (lowerTags.some(t => t.includes('produce') || t.includes('fruit') || t.includes('vegetable'))) return 'Produce';
  if (lowerTags.some(t => t.includes('dairy') || t.includes('milk') || t.includes('cheese') || t.includes('yogurt'))) return 'Dairy';
  if (lowerTags.some(t => t.includes('meat') || t.includes('beef') || t.includes('chicken') || t.includes('fish'))) return 'Meat';
  if (lowerTags.some(t => t.includes('bread') || t.includes('bakery'))) return 'Bakery';
  if (lowerTags.some(t => t.includes('frozen') || t.includes('ice cream'))) return 'Frozen';
  if (lowerTags.some(t => t.includes('beverage') || t.includes('drink') || t.includes('soda') || t.includes('juice') || t.includes('water'))) return 'Beverages';
  if (lowerTags.some(t => t.includes('cleaning') || t.includes('paper') || t.includes('household'))) return 'Household';
  return 'Pantry'; // Default for shelf-stable items
};

export const productService = {
  /**
   * Look up product details by barcode using free OpenFoodFacts API.
   * Checks local "known products" cache first.
   */
  identifyBarcode: async (barcode: string, backupImage?: string): Promise<ScanResult> => {
    // 1. Check Local Cache (User previously identified this item)
    const knownProduct = storageService.getKnownProduct(barcode);
    if (knownProduct) {
      return knownProduct;
    }

    // 2. Try OpenFoodFacts API (Free)
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      
      if (!response.ok) {
        throw new Error(`OpenFoodFacts API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 1 && data.product) {
        const p = data.product;
        
        const brand = p.brands ? p.brands.split(',')[0].trim() : '';
        const rawName = p.product_name || "";
        const fullName = brand && !rawName.toLowerCase().includes(brand.toLowerCase()) 
          ? `${brand} ${rawName}` 
          : rawName;

        return {
          productName: fullName, 
          description: p.generic_name || "",
          category: mapCategory(p.categories_tags),
          suggestedExpiryDays: 14,
          quantityUnit: p.quantity || "item",
          barcode: barcode,
          imageUrl: p.image_front_small_url || p.image_url || backupImage
        };
      }
      
      throw new Error("Product not found");
    } catch (error: any) {
      throw error;
    }
  }
};