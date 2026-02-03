import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ViewState, ProductItem, ScanResult, Category, SyncStatus } from './types';
import { storageService } from './services/storageService';
import { productService } from './services/geminiService';
import { CameraScanner } from './components/CameraScanner';
import { InventoryItem as ProductRow } from './components/InventoryItem';
import { ConfirmationModal } from './components/ConfirmationModal';
import { EditItemModal } from './components/EditItemModal';
import { SettingsModal } from './components/SettingsModal';
import { ScanBarcode, Settings, Search, History, ArrowLeft, PackageOpen, Cloud, CloudOff, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LIST');
  const [items, setItems] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [syncCode, setSyncCode] = useState<string | null>(storageService.getSyncCode());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  
  const [showCamera, setShowCamera] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [cameraMode, setCameraMode] = useState<'BARCODE' | 'PHOTO'>('BARCODE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  
  const [pendingBarcode, setPendingBarcode] = useState<string | undefined>(undefined);
  const [cameraMessage, setCameraMessage] = useState<string | undefined>(undefined);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);

  // Pull-to-refresh state
  const [pullOffset, setPullOffset] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef(0);

  // Load Initial Data & Run Maintenance
  useEffect(() => {
    const rawItems = storageService.getItems();
    const maintainedItems = storageService.runMaintenance(rawItems);
    setItems(maintainedItems);
    setCategories(storageService.getCategories());
  }, []);

  // Sync Logic
  const performSync = useCallback(async (localItems: ProductItem[]) => {
    if (!syncCode) return;
    setSyncStatus('syncing');
    
    const cloudItems = await storageService.pullFromCloud(syncCode);
    
    if (cloudItems) {
      const mergedMap = new Map<string, ProductItem>();
      [...localItems, ...cloudItems].forEach(item => {
        const existing = mergedMap.get(item.id);
        if (!existing || item.addedDate > existing.addedDate) {
          mergedMap.set(item.id, item);
        }
      });
      
      const mergedItems = Array.from(mergedMap.values());
      setItems(mergedItems);
      storageService.saveItems(mergedItems);
      
      if (JSON.stringify(mergedItems) !== JSON.stringify(cloudItems)) {
        await storageService.pushToCloud(syncCode, mergedItems);
      }
      setSyncStatus('synced');
    } else {
      const pushed = await storageService.pushToCloud(syncCode, localItems);
      setSyncStatus(pushed ? 'synced' : 'error');
    }
  }, [syncCode]);

  // Strategic Sync Management
  useEffect(() => {
    if (!syncCode) return;

    performSync(storageService.getItems());

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performSync(storageService.getItems());
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        performSync(storageService.getItems());
      }
    }, 30000); 

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [syncCode, performSync]);

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      touchStartRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartRef.current;
    if (diff > 0) {
      setPullOffset(Math.min(diff * 0.4, 80)); 
    }
  };

  const handleTouchEnd = () => {
    if (pullOffset > 60) {
      performSync(items);
    }
    setIsPulling(false);
    setPullOffset(0);
  };

  const saveAndSync = (newItems: ProductItem[]) => {
    setItems(newItems);
    storageService.saveItems(newItems);
    if (syncCode) performSync(newItems);
  };

  const handleUpdateSyncCode = (code: string | null) => {
    storageService.setSyncCode(code);
    setSyncCode(code);
  };

  const handleCapture = async (data: { type: 'IMAGE' | 'BARCODE', value: string, capturedImage?: string }) => {
    if (editingItem && data.type === 'IMAGE') {
       setEditingItem({ ...editingItem, imageUrl: data.value });
       setShowCamera(false);
       return;
    }

    if (data.type === 'BARCODE') {
      setIsProcessing(true);
      try {
        const result = await productService.identifyBarcode(data.value, data.capturedImage);
        setScanResult(result);
        setShowCamera(false);
      } catch (e) {
        setPendingBarcode(data.value);
        setCameraMode('PHOTO');
        setCameraMessage("Barcode not recognized. Take a photo to add manually.");
        setTimeout(() => setCameraMessage(undefined), 3000);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setScanResult({
        productName: "",
        category: 'Pantry',
        suggestedExpiryDays: 14,
        quantityUnit: "item",
        barcode: pendingBarcode,
        imageUrl: data.value
      });
      setShowCamera(false);
    }
  };

  const addItem = (itemData: Omit<ProductItem, 'id' | 'addedDate' | 'status'>) => {
    const existingItem = itemData.barcode ? items.find(i => i.barcode === itemData.barcode) : null;
    if (existingItem) {
      const updatedItem = {
        ...existingItem,
        ...itemData,
        quantity: existingItem.status === 'active' ? existingItem.quantity + itemData.quantity : itemData.quantity,
        status: 'active' as const,
        addedDate: Date.now()
      };
      saveAndSync([updatedItem, ...items.filter(i => i.id !== existingItem.id)]);
    } else {
      const newItem: ProductItem = { ...itemData, id: crypto.randomUUID(), addedDate: Date.now(), status: 'active' };
      saveAndSync([newItem, ...items]);
    }
    setScanResult(null);
  };

  const markRestocked = (id: string) => {
    saveAndSync(items.map(item => item.id === id ? { ...item, status: 'history' as const, addedDate: Date.now() } : item));
  };

  const filteredItems = items.filter(item => {
    if (view === 'LIST' && item.status !== 'active') return false;
    if (view === 'HISTORY' && item.status !== 'history') return false;
    return item.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-gray-50 select-none">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-3">
                {view === 'HISTORY' && (
                  <button onClick={() => setView('LIST')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} />
                  </button>
                )}
                <div>
                   <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                     {view === 'LIST' ? 'Restock List' : 'History'}
                     {syncCode && (
                       <button 
                         onClick={() => performSync(items)}
                         className={`transition-all duration-500 ${syncStatus === 'syncing' ? 'text-blue-500 scale-110' : syncStatus === 'error' ? 'text-red-500' : 'text-green-500 opacity-60'}`}
                       >
                         {syncStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : syncStatus === 'error' ? <CloudOff size={14} /> : <Cloud size={14} />}
                       </button>
                     )}
                   </h1>
                </div>
             </div>
             
             <div className="flex gap-2">
                <button onClick={() => setShowSettings(true)} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors">
                   <Settings size={20} />
                </button>
                {view === 'LIST' && (
                  <button onClick={() => setView('HISTORY')} className="p-2 bg-gray-100 rounded-full text-gray-600">
                    <History size={20} />
                  </button>
                )}
             </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>

        <div 
          className="absolute left-0 right-0 flex justify-center pointer-events-none transition-transform duration-200 overflow-hidden"
          style={{ height: pullOffset, top: '100%' }}
        >
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs bg-white/80 backdrop-blur-sm px-4 rounded-b-xl shadow-sm border-x border-b border-gray-100">
            <RefreshCw size={12} className={pullOffset > 60 ? 'animate-spin' : ''} />
            {pullOffset > 60 ? 'Release to Sync' : 'Pull for Cloud Update'}
          </div>
        </div>
      </header>

      <main 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 pb-24 relative touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${pullOffset}px)`, transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)' }}
      >
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <PackageOpen size={48} className="mb-4 opacity-50" />
            <p className="font-medium text-center px-6">Empty list.</p>
          </div>
        ) : (
          <div>
            {filteredItems.map(item => (
              <ProductRow 
                key={item.id} 
                item={item} 
                onPrimaryAction={view === 'LIST' ? markRestocked : (id) => saveAndSync(items.map(i => i.id === id ? { ...i, status: 'active', addedDate: Date.now() } : i))}
                onDelete={(id) => saveAndSync(items.filter(i => i.id !== id))}
                onEdit={(id) => setEditingItem(items.find(i => i.id === id) || null)}
              />
            ))}
          </div>
        )}
      </main>

      {view === 'LIST' && (
        <div className="fixed bottom-8 right-6 z-20">
          <button 
            onClick={() => { setCameraMode('BARCODE'); setShowCamera(true); }}
            className="bg-blue-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform shadow-blue-500/30"
          >
            <ScanBarcode size={28} />
          </button>
        </div>
      )}

      {showCamera && (
        <CameraScanner 
          onCapture={handleCapture} 
          onClose={() => setShowCamera(false)} 
          isProcessing={isProcessing}
          mode={cameraMode}
          message={cameraMessage}
        />
      )}

      {scanResult && (
        <ConfirmationModal 
          scanResult={scanResult} 
          categories={categories}
          onConfirm={addItem} 
          onCancel={() => setScanResult(null)} 
        />
      )}
      
      {editingItem && (
        <EditItemModal
          item={editingItem}
          categories={categories}
          onSave={(id, updates) => saveAndSync(items.map(i => i.id === id ? { ...i, ...updates } : i))}
          onDelete={(id) => saveAndSync(items.filter(i => i.id !== id))}
          onClose={() => setEditingItem(null)}
          onTakePhoto={() => { setCameraMode('PHOTO'); setShowCamera(true); }}
        />
      )}

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        categories={categories}
        onSaveCategories={(cats) => { storageService.saveCategories(cats); setCategories(cats); }}
        syncCode={syncCode}
        onUpdateSyncCode={handleUpdateSyncCode}
      />
    </div>
  );
};

export default App;