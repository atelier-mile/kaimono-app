import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import { isEstimatedPrice } from './item-fields';

export type ItemCategory = '食品' | '飲み物' | '日用品';
export type ShoppingFrequency = 'いつも買う' | 'たまに買う' | '一度だけ';
export type AppMode = 'simple' | 'advanced';

export type InventoryItem = {
  id: string;
  name: string;
  category: ItemCategory;
  frequency: ShoppingFrequency;
  inStock: boolean;
  estimatedPrice?: number;
  icon?: string;
};

type InventoryContextValue = {
  items: InventoryItem[];
  isReady: boolean;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  addItem: (item: Omit<InventoryItem, 'id' | 'inStock'>) => void;
  updateItem: (itemId: string, changes: Pick<InventoryItem, 'name' | 'category' | 'frequency' | 'estimatedPrice' | 'icon'>) => void;
  removeItem: (itemId: string) => void;
  toggleStock: (itemId: string) => void;
};

const STORAGE_KEY = '@kaimono-app/inventory-items-v1';
const MODE_STORAGE_KEY = '@kaimono-app/display-mode-v1';

const startingItems: InventoryItem[] = [
  { id: 'rice', name: 'お米', category: '食品', frequency: 'いつも買う', inStock: true },
  { id: 'eggs', name: 'たまご', category: '食品', frequency: 'いつも買う', inStock: true },
  { id: 'bread', name: '食パン', category: '食品', frequency: 'たまに買う', inStock: false },
  { id: 'milk', name: '牛乳', category: '飲み物', frequency: 'いつも買う', inStock: false },
  { id: 'tea', name: 'お茶', category: '飲み物', frequency: 'たまに買う', inStock: true },
  { id: 'tissue', name: 'ティッシュ', category: '日用品', frequency: 'いつも買う', inStock: false },
  { id: 'detergent', name: '洗剤', category: '日用品', frequency: 'たまに買う', inStock: true },
];

function isInventoryItem(value: unknown): value is InventoryItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<InventoryItem>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    (item.category === '食品' || item.category === '飲み物' || item.category === '日用品') &&
    (item.frequency === 'いつも買う' ||
      item.frequency === 'たまに買う' ||
      item.frequency === '一度だけ') &&
    typeof item.inStock === 'boolean'
  );
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>(startingItems);
  const [mode, setMode] = useState<AppMode>('simple');
  const [isReady, setIsReady] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const savedInventory = useRef('');
  const savedDisplayMode = useRef<AppMode>('simple');
  const saveQueue = useRef(Promise.resolve());

  useEffect(() => {
    let isActive = true;

    async function loadItems() {
      try {
        const savedItems = await AsyncStorage.getItem(STORAGE_KEY);
        const savedMode = await AsyncStorage.getItem(MODE_STORAGE_KEY);
        if (savedMode === 'simple' || savedMode === 'advanced') {
          if (isActive) setMode(savedMode);
          savedDisplayMode.current = savedMode;
        }
        let loadedItems = startingItems;
        if (savedItems !== null) {
          const parsedItems: unknown = JSON.parse(savedItems);
          if (!Array.isArray(parsedItems) || !parsedItems.every(isInventoryItem)) {
            throw new Error('保存データの形式を確認できませんでした。');
          }
          // 任意項目がない旧データも読み込む。不正な任意項目で一覧全体を捨てない。
          loadedItems = parsedItems.map((item) => ({
            ...item,
            estimatedPrice: isEstimatedPrice(item.estimatedPrice) ? item.estimatedPrice : undefined,
            icon: typeof item.icon === 'string' ? item.icon : undefined,
          }));
        }
        if (isActive) {
          savedInventory.current = JSON.stringify(loadedItems);
          setItems(loadedItems);
          setCanSave(true);
        }
      } catch {
        if (isActive) {
          setItems([]);
          Alert.alert('保存データを読み込めません', '元のデータは保持しています。上書きを防ぐため変更は保存しません。アプリを開き直してください。');
        }
      } finally {
        if (isActive) setIsReady(true);
      }
    }

    void loadItems();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !canSave || mode === savedDisplayMode.current) return;
    savedDisplayMode.current = mode;
    saveQueue.current = saveQueue.current.then(() => AsyncStorage.setItem(MODE_STORAGE_KEY, mode)).catch(() => {
      Alert.alert('設定を保存できません', '空き容量などを確認し、表示モードを選び直してください。');
    });
  }, [mode, isReady, canSave]);

  useEffect(() => {
    const serialized = JSON.stringify(items);
    if (!isReady || !canSave || serialized === savedInventory.current) return;
    savedInventory.current = serialized;
    // 連続操作でも古い書き込みが後から完了しないよう順番に保存する。
    saveQueue.current = saveQueue.current.then(() => AsyncStorage.setItem(STORAGE_KEY, serialized)).catch(() => {
      Alert.alert('品物を保存できません', '変更はまだ保存されていません。空き容量などを確認して、もう一度操作してください。');
    });
  }, [items, isReady, canSave]);

  function addItem(item: Omit<InventoryItem, 'id' | 'inStock'>) {
    if (!canSave) return;
    const newItem: InventoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      inStock: true,
    };
    setItems((currentItems) => [...currentItems, newItem]);
  }

  function updateItem(
    itemId: string,
    changes: Pick<InventoryItem, 'name' | 'category' | 'frequency' | 'estimatedPrice' | 'icon'>
  ) {
    if (!canSave) return;
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === itemId ? { ...item, ...changes } : item))
    );
  }

  function removeItem(itemId: string) {
    if (!canSave) return;
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }

  function toggleStock(itemId: string) {
    if (!canSave) return;
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, inStock: !item.inStock } : item
      )
    );
  }

  return (
    <InventoryContext.Provider
      value={{ items, isReady, mode, setMode, addItem, updateItem, removeItem, toggleStock }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('在庫の情報を読み込めませんでした。');
  }
  return context;
}
