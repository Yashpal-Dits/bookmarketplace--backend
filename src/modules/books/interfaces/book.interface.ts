export interface IBook {
  _id: string;
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  description: string;
  coverImage?: string;
  category?: any;
  status: string;
  createdBySellerId?: string;
  rating: number;
  minPrice?: number | null;
  mrp?: number | null;
  totalStock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookPayload {
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  description: string;
  coverImage?: string;
  category?: string;
}