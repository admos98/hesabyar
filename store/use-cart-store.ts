import { create } from 'zustand';
import { SellableItem } from '../types';

type CartItem = SellableItem & { quantity: number };

type CartState = {
  items: CartItem[];
  addToCart: (item: SellableItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, amount: number) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addToCart: (item) => set((state) => {
    const existingItem = state.items.find((i) => i.id === item.id);
    if (existingItem) {
      return {
        items: state.items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };
    }
    return { items: [...state.items, { ...item, quantity: 1 }] };
  }),
  removeFromCart: (itemId) => set((state) => ({
    items: state.items.filter((i) => i.id !== itemId),
  })),
  updateQuantity: (itemId, amount) => set((state) => ({
    items: state.items
      .map((i) =>
        i.id === itemId ? { ...i, quantity: Math.max(0, i.quantity + amount) } : i
      )
      .filter((i) => i.quantity > 0), // Remove item if quantity is 0
  })),
  clearCart: () => set({ items: [] }),
}));
