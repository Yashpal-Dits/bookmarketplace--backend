export interface DashboardSummary {
  totalSellers: number;
  pendingSellers: number;
  approvedSellers: number;
  rejectedSellers: number;
  totalCustomers: number;
  totalBooks: number;
  pendingBooks: number;
  approvedBooks: number;
  rejectedBooks: number;
  totalListings: number;
  activeListings: number;
}

export interface UpdateBookCatalogPayload {
  title?: string;
  author?: string;
  publisher?: string;
  description?: string;
  isbn?: string;
  coverImage?: string;
  category?: string;
}