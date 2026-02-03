import { Apple, Milk, Beef, Croissant, Snowflake, Package, Coffee, Home, HelpCircle, Tag } from 'lucide-react';

// We keep a mapping for the "Standard" defaults to ensure they look nice.
// Custom categories will get deterministic fallback styles.

const STANDARD_ICONS: Record<string, any> = {
  'Produce': Apple,
  'Dairy': Milk,
  'Meat': Beef,
  'Bakery': Croissant,
  'Frozen': Snowflake,
  'Pantry': Package,
  'Beverages': Coffee,
  'Household': Home,
  'Other': HelpCircle,
};

const STANDARD_COLORS: Record<string, string> = {
  'Produce': 'bg-green-100 text-green-700',
  'Dairy': 'bg-blue-100 text-blue-700',
  'Meat': 'bg-red-100 text-red-700',
  'Bakery': 'bg-yellow-100 text-yellow-700',
  'Frozen': 'bg-cyan-100 text-cyan-700',
  'Pantry': 'bg-orange-100 text-orange-700',
  'Beverages': 'bg-purple-100 text-purple-700',
  'Household': 'bg-gray-100 text-gray-700',
  'Other': 'bg-slate-100 text-slate-700',
};

// Fallback palettes for custom categories
const PALETTES = [
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-lime-100 text-lime-700',
  'bg-fuchsia-100 text-fuchsia-700',
  'bg-rose-100 text-rose-700',
];

export const getCategoryTheme = (category: string) => {
  // 1. Check if it's a standard category
  if (STANDARD_ICONS[category]) {
    return {
      Icon: STANDARD_ICONS[category],
      colorClass: STANDARD_COLORS[category]
    };
  }

  // 2. If custom, generate a deterministic style based on string length/chars
  const charCodeSum = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const paletteIndex = charCodeSum % PALETTES.length;

  return {
    Icon: Tag, // Generic icon for custom categories
    colorClass: PALETTES[paletteIndex]
  };
};

// Export these for legacy components if they need strict mapping, 
// but preferred use is getCategoryTheme
export const CATEGORY_ICONS = STANDARD_ICONS;
export const CATEGORY_COLORS = STANDARD_COLORS;