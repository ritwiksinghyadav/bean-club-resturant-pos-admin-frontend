export interface Variant {
  id: string;
  name: string;
}

export interface ItemVariant {
  id: string;
  price: string;
  sku?: string;
  isActive: boolean;
  variant: Variant;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  imageUrl: string;
  isActive: boolean;
  variants: ItemVariant[];
  tags: { tag: { name: string } }[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  menuItems: MenuItem[];
}

export interface CreatedOrderDetails {
  order: {
    tokenNumber: number;
    pointsRedeemed?: number;
  };
  originalAmount: number;
  finalAmount: number;
  discount: number;
}
