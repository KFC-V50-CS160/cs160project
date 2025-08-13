import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface Dish {
  id: string;
  items: string[];
  createdAt: Date;
}

export interface InventoryItem {
  name: string;
  category: string;
  expiresIn: string;
  status: string;
  count: number;
}

interface InventoryContextType {
  dishes: Dish[];
  setDishes: React.Dispatch<React.SetStateAction<Dish[]>>;
  inventoryItems: InventoryItem[];
  setInventoryItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  getCurrentPlateIngredients: () => string[];
  saveToStorage: () => void;
  loadFromStorage: () => void;
  loaded: boolean; // 新增：表示本地存储的库存/盘子数据已加载完成
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// Storage keys
const DISHES_STORAGE_KEY = 'magicfridge_dishes';
const INVENTORY_STORAGE_KEY = 'magicfridge_inventory';

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loaded, setLoaded] = useState(false); // 新增

  // Load data from localStorage on component mount
  useEffect(() => {
    loadFromStorage();
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    saveToStorage();
  }, [dishes, inventoryItems]);

  const saveToStorage = () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Save dishes with proper date serialization
      const dishesToSave = dishes.map(dish => ({
        ...dish,
        createdAt: dish.createdAt.toISOString()
      }));
      localStorage.setItem(DISHES_STORAGE_KEY, JSON.stringify(dishesToSave));
      
      // Save inventory items
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventoryItems));
      
      console.log('[InventoryContext] Data saved to localStorage');
    } catch (error) {
      console.error('[InventoryContext] Failed to save to localStorage:', error);
    }
  };

  const loadFromStorage = () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Load dishes with proper date deserialization
      const savedDishes = localStorage.getItem(DISHES_STORAGE_KEY);
      if (savedDishes) {
        const parsedDishes = JSON.parse(savedDishes).map((dish: any) => ({
          ...dish,
          createdAt: new Date(dish.createdAt)
        }));
        setDishes(parsedDishes);
        console.log('[InventoryContext] Dishes loaded from localStorage:', parsedDishes.length);
      }
      
      // Load inventory items
      const savedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (savedInventory) {
        const parsedInventory = JSON.parse(savedInventory);
        setInventoryItems(parsedInventory);
        console.log('[InventoryContext] Inventory loaded from localStorage:', parsedInventory.length);
      }
    } catch (error) {
      console.error('[InventoryContext] Failed to load from localStorage:', error);
    } finally {
      setLoaded(true); // 标记完成（即便没有数据也视为已加载）
    }
  };

  const getCurrentPlateIngredients = () => {
    // Get ingredients from the most recent dish, or combine all dishes
    if (dishes.length === 0) return [];
    
    // If there's only one dish, use its ingredients
    if (dishes.length === 1) return dishes[0].items;
    
    // If multiple dishes, combine all ingredients (remove duplicates)
    const allIngredients = dishes.flatMap(dish => dish.items);
    return [...new Set(allIngredients)];
  };

  return (
    <InventoryContext.Provider value={{
      dishes,
      setDishes,
      inventoryItems,
      setInventoryItems,
      getCurrentPlateIngredients,
      saveToStorage,
      loadFromStorage,
      loaded // 新增
    }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}