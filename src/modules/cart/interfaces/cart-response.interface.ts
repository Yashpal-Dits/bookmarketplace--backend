import { Types } from 'mongoose';

export interface CartItemResponse {
  _id: Types.ObjectId;
  listingId: Types.ObjectId;
  quantity: number;
  listing: {
    price: number;
    mrp: number;
    stock: number;
    isActive: boolean;
  };
  book: {
    _id: Types.ObjectId;
    title: string;
    author: string;
    coverImage?: string;
    isbn: string;
    category?: any;
  } | null;
  seller: {
    _id: Types.ObjectId;
    businessName: string;
    storeLogo?: string;
  } | null;
}