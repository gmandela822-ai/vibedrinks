import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Product, CartItem, ComboData } from '@shared/schema';

interface CartContextType {
  items: CartItem[];
  combos: ComboData[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  addCombo: (combo: ComboData) => void;
  removeCombo: (comboId: string) => void;
  clearCart: () => void;
  subtotal: number;
  comboDiscount: number;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vibe-drinks-cart');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  const [combos, setCombos] = useState<ComboData[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vibe-drinks-combos');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('vibe-drinks-cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('vibe-drinks-combos', JSON.stringify(combos));
  }, [combos]);

  const addItem = (product: Product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.productId === product.id && !item.isComboItem);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id && !item.isComboItem
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { productId: product.id, product, quantity }];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId || item.isComboItem));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.productId === productId && !item.isComboItem ? { ...item, quantity } : item
      )
    );
  };

  const addCombo = (combo: ComboData) => {
    setCombos(prev => [...prev, combo]);
    const geloItems = combo.gelos.map(g => ({
      productId: g.product.id,
      product: g.product,
      quantity: g.quantity,
      isComboItem: true,
      comboId: combo.id,
    }));
    setItems(prev => [
      ...prev,
      { productId: combo.destilado.id, product: combo.destilado, quantity: 1, isComboItem: true, comboId: combo.id },
      { productId: combo.energetico.id, product: combo.energetico, quantity: combo.energeticoQuantity, isComboItem: true, comboId: combo.id },
      ...geloItems,
    ]);
  };

  const removeCombo = (comboId: string) => {
    setCombos(prev => prev.filter(c => c.id !== comboId));
    setItems(prev => prev.filter(item => item.comboId !== comboId));
  };

  const clearCart = () => {
    setItems([]);
    setCombos([]);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.salePrice) * item.quantity,
    0
  );

  const comboDiscount = combos.reduce(
    (sum, combo) => sum + (combo.originalTotal - combo.discountedTotal),
    0
  );

  const total = subtotal - comboDiscount;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        combos,
        addItem,
        removeItem,
        updateQuantity,
        addCombo,
        removeCombo,
        clearCart,
        subtotal,
        comboDiscount,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
