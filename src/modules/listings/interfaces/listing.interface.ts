
export interface IListing {
  _id: string;
  bookId: string;
  sellerId: string;
  price: number;
  mrp: number;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateListingPayload {
  bookId: string;
  price: number;
  mrp: number;
  stock: number;
}

export interface UpdateListingPayload {
  price?: number;
  mrp?: number;
  stock?: number;
  isActive?: boolean;
}

export interface ListingWithDetails extends IListing {
  book?: any;
  seller?: any;
}