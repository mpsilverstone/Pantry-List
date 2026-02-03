import React, { useState } from 'react';
import { X, Plus, Trash2, GripVertical, RotateCcw, Users, Copy, Check, Info } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onSaveCategories: (categories: string[]) => void;
  syncCode: string | null;
  onUpdateSyncCode: (code: string | null) => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose, categories, onSaveCategories, syncCode, onUpdateSyncCode }) => {
  const [newCategory, setNewCategory] = useState('');
  const [localCategories, setLocalCategories] = useState<string[]>(categories);
  const [editingSyncCode, setEditingSyncCode] = useState(syncCode || '');
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    setLocalCategories(categories);
  }, [categories, isOpen]);

  React.useEffect(() => {
    setEditingSyncCode(syncCode || '');
  }, [syncCode, isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (syncCode) {
      navigator.clipboard.writeText(syncCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSyncSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = editingSyncCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (cleanCode) {
      onUpdateSyncCode(cleanCode);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-xl text-gray-900">Settings</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Household Sync Section */}
          <section className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
            <h3 className="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              Household Sharing
            </h3>
            
            {!syncCode ? (
              <div className="space-y-3">
                <p className="text-xs text-blue-700/70 font-medium leading-relaxed">
                  To share your list, invent a unique secret code and have your family enter the same one here.
                </p>
                <form onSubmit={handleSyncSubmit} className="space-y-2">
                  <input 
                    type="text"
                    value={editingSyncCode}
                    onChange={(e) => setEditingSyncCode(e.target.value)}
                    placeholder="e.g. smith-family-kitchen"
                    className="w-full p-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                  />
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm"
                  >
                    Start Syncing
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-xl border border-blue-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Active Code</p>
                    <p className="font-mono font-bold text-blue-800">{syncCode}</p>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={() => onUpdateSyncCode(null)}
                  className="w-full text-xs text-red-500 font-bold py-2 border border-red-100 rounded-xl bg-red-50/30"
                >
                  Stop Sharing / Leave Household
                </button>
              </div>
            )}
          </section>

          {/* Categories Section */}
          <section>
            <div className="flex justify-between items-end mb-4 px-1">
               <h3 className="font-bold text-gray-800 text-lg">Inventory Aisles</h3>
               <button onClick={() => { setLocalCategories(DEFAULT_CATEGORIES); onSaveCategories(DEFAULT_CATEGORIES); }} className="text-xs font-medium text-blue-600 flex items-center gap-1">
                 <RotateCcw size={12} /> Reset
               </button>
            </div>
            
            <div className="space-y-2 mb-4">
              {localCategories.map((cat) => (
                <div key={cat} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <div className="text-gray-300"><GripVertical size={20} /></div>
                  <span className="flex-1 font-medium text-gray-700 text-sm">{cat}</span>
                  <button onClick={() => onSaveCategories(localCategories.filter(c => c !== cat))} className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (newCategory.trim()) {
                const updated = [...localCategories, newCategory.trim()];
                onSaveCategories(updated);
                setNewCategory('');
              }
            }} className="flex gap-2">
              <input 
                type="text" 
                value={newCategory} 
                onChange={(e) => setNewCategory(e.target.value)} 
                placeholder="Add new aisle..." 
                className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm" 
              />
              <button type="submit" disabled={!newCategory.trim()} className="bg-blue-600 text-white p-3 rounded-xl disabled:opacity-50 transition-opacity">
                <Plus size={20} />
              </button>
            </form>
          </section>

          <div className="pt-6 border-t border-gray-100 px-1">
             <div className="flex items-start gap-2 text-gray-400">
               <Info size={14} className="mt-0.5 shrink-0" />
               <p className="text-[11px] leading-relaxed">
                 This app uses public infrastructure to sync your data at no cost. For better privacy, use a complex, unique household code.
               </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};