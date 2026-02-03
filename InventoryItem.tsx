import React from 'react';
import { ProductItem } from '../types';
import { getCategoryTheme } from '../constants';
import { Trash2, Check, Plus } from 'lucide-react';

interface Props {
  item: ProductItem;
  onPrimaryAction: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export const InventoryItem: React.FC<Props> = ({ item, onPrimaryAction, onDelete, onEdit }) => {
  const { Icon, colorClass } = getCategoryTheme(item.category);
  const isActive = item.status === 'active';
  
  return (
    <div 
      className={`p-3 rounded-2xl shadow-sm border flex items-center gap-3 mb-3 transition-all select-none touch-manipulation cursor-pointer ${isActive ? 'bg-white border-gray-100 hover:shadow-md' : 'bg-gray-50 border-gray-100 opacity-60'}`}
      onClick={() => onEdit && onEdit(item.id)}
    >
      
      {/* Image / Icon */}
      <div className={`w-14 h-14 flex items-center justify-center rounded-xl overflow-hidden shrink-0 ${!item.imageUrl ? (isActive ? colorClass : 'bg-gray-200 text-gray-500') : 'bg-gray-100 border border-gray-200'}`}>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="w-full h-full object-cover pointer-events-none" />
        ) : (
          <Icon size={24} />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 pl-1">
        <h3 className={`text-[16px] font-bold leading-tight truncate ${isActive ? 'text-gray-900' : 'text-gray-500 line-through decoration-gray-400'}`}>
          {item.name}
        </h3>
        
        {/* Row for metadata - forced nowrap with horizontal scroll if needed */}
        <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden mt-1.5">
           {/* Quantity Bubble */}
           <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold min-w-[28px] shrink-0 ${isActive ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'}`}>
             {item.quantity}
           </div>

           {/* Unit Bubble */}
           <div className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border shrink-0 ${isActive ? 'bg-gray-100 border-gray-200 text-gray-600' : 'bg-transparent border-gray-200 text-gray-400'}`}>
             {item.unit}
           </div>

           {/* Category Badge (Active) */}
           {isActive && (
             <div className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-transparent/10 shrink-0 ${colorClass}`}>
               {item.category}
             </div>
           )}

           {/* Date Badge (History) */}
           {!isActive && (
              <div className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-medium text-gray-400 bg-white border border-gray-100 whitespace-nowrap shrink-0">
                {new Date(item.addedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                <span className="mx-1 opacity-50">•</span>
                {new Date(item.addedDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </div>
           )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 pl-1">
        {isActive ? (
          <button 
            onClick={(e) => { e.stopPropagation(); onPrimaryAction(item.id); }}
            className="w-10 h-10 rounded-full bg-gray-50 text-gray-300 border border-transparent hover:border-green-200 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-all active:scale-95"
            title="Mark as Restocked"
          >
            <Check size={22} strokeWidth={3} />
          </button>
        ) : (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); onPrimaryAction(item.id); }}
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
              title="Add back to list"
            >
              <Plus size={22} />
            </button>
            {onDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Delete permanently"
              >
                <Trash2 size={18} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};