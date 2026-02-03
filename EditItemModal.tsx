import React, { useState } from 'react';
import { ProductItem } from '../types';
import { X, Save, Trash2, Minus, Plus, ChevronDown, Camera } from 'lucide-react';

interface Props {
  item: ProductItem;
  categories: string[];
  onSave: (id: string, updates: Partial<ProductItem>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onTakePhoto: () => void;
}

const UNITS = ["item", "lbs", "oz", "kg", "g", "L", "mL", "Gal", "cups", "pcs"];

export const EditItemModal: React.FC<Props> = ({ item, categories, onSave, onDelete, onClose, onTakePhoto }) => {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description || "");
  const [quantity, setQuantity] = useState(item.quantity);
  const [unit, setUnit] = useState(item.unit);
  const [category, setCategory] = useState(item.category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(item.id, { 
      name, 
      description,
      quantity, 
      unit, 
      category, 
      imageUrl: item.imageUrl 
    });
  };

  const increment = () => setQuantity(q => q + 1);
  const decrement = () => setQuantity(q => Math.max(0.1, q - 1));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
          <h2 className="font-bold text-xl text-gray-800">Edit Item</h2>
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Preview / Retake */}
          <div className="flex justify-center -mt-2 mb-4 relative">
             <button 
               type="button"
               onClick={onTakePhoto}
               className="relative group active:scale-95 transition-transform"
               title="Change photo"
             >
               <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 relative">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                      <Camera size={32} />
                    </div>
                  )}
               </div>
               <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full border-4 border-white shadow-sm hover:bg-blue-700 transition-colors">
                 <Camera size={14} />
               </div>
             </button>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Product Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-semibold text-lg transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Description</label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Flavor, type, etc."
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-gray-700 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Quantity Control */}
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Quantity</label>
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-1.5 h-[60px]">
                   <button 
                     type="button" 
                     onClick={decrement}
                     className="w-12 h-full rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                   >
                     <Minus size={20} />
                   </button>
                   <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    step="any"
                    className="w-full text-center bg-transparent font-bold text-xl outline-none text-gray-800"
                  />
                  <button 
                     type="button" 
                     onClick={increment}
                     className="w-12 h-full rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                   >
                     <Plus size={20} />
                   </button>
                </div>
             </div>
             
             {/* Unit Selector */}
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Unit</label>
               <div className="relative h-[60px]">
                 <select 
                  value={unit} 
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full h-full px-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none appearance-none font-semibold text-gray-700 text-lg transition-all"
                >
                  {UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronDown size={20} />
                </div>
               </div>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Category</label>
            <div className="relative">
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-4 h-[60px] bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none appearance-none font-medium text-gray-700 text-lg transition-all"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown size={20} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex gap-3">
             <button 
               type="button"
               onClick={() => { onDelete(item.id); onClose(); }}
               className="flex-1 py-4 text-red-600 font-bold bg-red-50 rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2 active:scale-95"
             >
               <Trash2 size={20} />
               Delete
             </button>
             <button 
               type="submit"
               className="flex-[2] py-4 text-white font-bold bg-blue-600 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95"
             >
               <Save size={20} />
               Save
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};