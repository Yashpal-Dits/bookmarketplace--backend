export interface ICategory {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  image?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}

export interface CategoryWithCount extends ICategory {
  bookCount: number;
}