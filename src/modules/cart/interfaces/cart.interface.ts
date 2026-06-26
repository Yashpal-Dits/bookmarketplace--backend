export interface ICart {
  _id: string;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItem {
  _id: string;
  cartId: string;
  listingId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToCartPayload {
  listingId: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}

export interface CartItemResponse {
  _id: string;
  listingId: string;
  quantity: number;
  listing: {
    price: number;
    mrp: number;
    stock: number;
    isActive: boolean;
  };
  book: {
    _id: string;
    title: string;
    author: string;
    coverImage?: string;
    isbn: string;
    category?: any;
  } | null;
  seller: {
    _id: string;
    businessName: string;
    storeLogo?: string;
  } | null;
}