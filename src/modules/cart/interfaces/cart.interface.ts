export interface CartBook {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  coverImage?: string;
  description?: string;
  publisher?: string;
  category?: any;
  status?: any;
  rating?: number;
  minPrice?: number;
  mrp?: number;
  totalStock?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CartListing {
  _id?: string;
  price: number;
  originalPrice?: number;
  mrp?: number;
  discountPercent?: number;
  condition?: string;
  format?: string;
  stock: number;
  sellerId?: string;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CartSeller {
  _id?: string;
  userId?: string;
  businessName?: string;
  contactPerson?: string;
  email?: string;
  mobileNumber?: string;
  status?: any;
  storeLogo?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CartItemResponse {
  _id: string;
  quantity: number;
  book: CartBook | null;
  listing: CartListing | null;
  seller?: CartSeller | null;
}

export interface CartResponse {
  _id: string;
  customerId: string;
  items: CartItemResponse[];
  totalItems: number;
  subtotal: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}