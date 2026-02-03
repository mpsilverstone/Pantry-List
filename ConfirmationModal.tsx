import React, { useState } from 'react';
import { ScanResult, ProductItem } from '../types';
import { X, Check } from 'lucide-react';

interface Props {
  scanResult: ScanResult;
  categories: string[];
  onConfirm: (item: Omit<ProductItem, 'id' | 'addedDate' | 'status'>) => void;
  onCancel: () => void;
}

const UNITS = ["item", "lbs", "oz", "kg", "g", "L", "mL", "Gal", "cups", "pcs"];

export const ConfirmationModal: React.FC<Props> = ({ scanResult, categories, onConfirm, onCancel }) => {
  const [name, setName] = useState(scanResult.productName || "");
  const [description, setDescription] = useState(scanResult.description || "");
  // Default to mapped category if valid, else first available
  const [category, setCategory] = useState<string>(
    categories.includes(scanResult.category) ? scanResult.category : (categories[0] || 'Other')
  );
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState(scanResult.quantityUnit || 'item');
  const [imageUrl] = useState(scanResult.imageUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      name,
      description,
      category,
      quantity,
      unit,
      barcode: scanResult.barcode,
      imageUrl: imageUrl
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-lg text-gray-800">Add to Restock List</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Image Preview if available */}
          {imageUrl && (
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full border-4 border-gray-100 overflow-hidden shadow-sm">
                <img src={imageUrl} alt="Product Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name (with brand)"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Flavor, size, or details..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
               <input 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
               <select 
                value={unit} 
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Check size={20} />
            Add to List
          </button>
        </form>
      </div>
    </div>
  );
};