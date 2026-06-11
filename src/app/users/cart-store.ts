import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  imageUrl?: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
}

interface CartState {
  items: CartItem[];
  token: string | null;
  refreshToken: string | null;
  customer: Customer | null;
  orderType: 'dinein' | 'takeaway' | null;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (menuItemId: string, variantId?: string) => void;
  updateQuantity: (
    menuItemId: string,
    quantity: number,
    variantId?: string
  ) => void;
  clearCart: () => void;
  setAuth: (
    token: string | null,
    refreshToken: string | null,
    customer: Customer | null
  ) => void;
  setOrderType: (type: 'dinein' | 'takeaway' | null) => void;
  logout: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      token: null,
      refreshToken: null,
      customer: null,
      orderType: null,
      addItem: (newItem) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.menuItemId === newItem.menuItemId &&
              item.variantId === newItem.variantId
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex].quantity += newItem.quantity || 1;
            return { items: updatedItems };
          }

          return {
            items: [
              ...state.items,
              { ...newItem, quantity: newItem.quantity || 1 }
            ]
          };
        }),
      removeItem: (menuItemId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.menuItemId === menuItemId && item.variantId === variantId)
          )
        })),
      updateQuantity: (menuItemId, quantity, variantId) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.menuItemId === menuItemId && item.variantId === variantId
                ? { ...item, quantity }
                : item
            )
            .filter((item) => item.quantity > 0)
        })),
      clearCart: () => set({ items: [], orderType: null }),
      setAuth: (token, refreshToken, customer) =>
        set({ token, refreshToken, customer }),
      setOrderType: (orderType) => set({ orderType }),
      logout: () =>
        set({
          token: null,
          refreshToken: null,
          customer: null,
          items: [],
          orderType: null
        })
    }),
    {
      name: 'bean-club-customer-store'
    }
  )
);
