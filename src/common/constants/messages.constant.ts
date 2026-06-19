export const SUCCESS_MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'Registration successful',
  LOGOUT_SUCCESS: 'Logout successful',

  // Users
  USER_CREATED: 'User created successfully',
  USER_FETCHED: 'User fetched successfully',
  USERS_FETCHED: 'Users fetched successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  PROFILE_FETCHED: 'Profile fetched successfully',

    // Seller
  SELLER_REGISTERED: 'Seller registration successful',
  SELLER_VERIFIED: 'Seller verified successfully',

  // Books
  BOOK_CREATED: 'Book created successfully',
  BOOK_FETCHED: 'Book fetched successfully',
  BOOKS_FETCHED: 'Books fetched successfully',
  BOOK_UPDATED: 'Book updated successfully',
  BOOK_DELETED: 'Book deleted successfully',

  // Categories
  CATEGORY_CREATED: 'Category created successfully',
  CATEGORY_FETCHED: 'Category fetched successfully',
  CATEGORIES_FETCHED: 'Categories fetched successfully',
  CATEGORY_UPDATED: 'Category updated successfully',
  CATEGORY_DELETED: 'Category deleted successfully',

  // Orders
  ORDER_CREATED: 'Order created successfully',
  ORDER_FETCHED: 'Order fetched successfully',
  ORDERS_FETCHED: 'Orders fetched successfully',
  ORDER_UPDATED: 'Order updated successfully',
  ORDER_DELETED: 'Order deleted successfully',

  // Upload
  FILE_UPLOADED: 'File uploaded successfully',
};

export const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
  UNAUTHORIZED: 'Unauthorized access',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  TOKEN_MISSING: 'Token is missing',

  // Users
  USER_NOT_FOUND: 'User not found',
  USER_NOT_CREATED: 'Failed to create user',
  USER_NOT_UPDATED: 'Failed to update user',
  EMAIL_ALREADY_IN_USE: 'Email is already in use',

  // Seller
  SELLER_NOT_FOUND: 'Seller not found',
  SELLER_NOT_VERIFIED: 'Seller account is not verified',
  ONLY_SELLER_CAN_LIST_BOOKS: 'Only verified sellers can list books',

  // Books
  BOOK_NOT_FOUND: 'Book not found',
  BOOK_NOT_CREATED: 'Failed to create book',
  BOOK_NOT_UPDATED: 'Failed to update book',
  BOOK_NOT_DELETED: 'Failed to delete book',
  BOOK_OUT_OF_STOCK: 'Book is out of stock',

  // Categories
  CATEGORY_NOT_FOUND: 'Category not found',
  CATEGORY_NOT_CREATED: 'Failed to create category',
  CATEGORY_NOT_UPDATED: 'Failed to update category',
  CATEGORY_NOT_DELETED: 'Category has associated books, cannot delete',

  // Orders
  ORDER_NOT_FOUND: 'Order not found',
  ORDER_NOT_CREATED: 'Failed to create order',
  ORDER_NOT_UPDATED: 'Failed to update order',
  ORDER_CANNOT_CANCEL: 'Order cannot be cancelled in its current state',

  // Validation
  VALIDATION_FAILED: 'Validation failed',
  INVALID_OBJECT_ID: 'Invalid ID format',

  // Upload
  FILE_NOT_FOUND: 'File not found',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type. Only images are allowed',

  // General
  INTERNAL_SERVER_ERROR: 'Internal server error',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'Resource not found',
  DUPLICATE_ENTRY: 'Duplicate entry found',
};

export const VALIDATION_MESSAGES = {
  // Auth
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please provide a valid email address',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters long',
  PASSWORD_MAX_LENGTH: 'Password must not exceed 128 characters',
  NAME_REQUIRED: 'Name is required',
  NAME_MIN_LENGTH: 'Name must be at least 2 characters long',
  NAME_MAX_LENGTH: 'Name must not exceed 50 characters',
  VALIDATION_FAILED: "Validation failed",

  // Books
  TITLE_REQUIRED: 'Book title is required',
  AUTHOR_REQUIRED: 'Author name is required',
  PRICE_REQUIRED: 'Price is required',
  PRICE_MUST_BE_POSITIVE: 'Price must be a positive number',
  CATEGORY_REQUIRED: 'Category is required',
  DESCRIPTION_REQUIRED: 'Description is required',

  // Category
  CATEGORY_NAME_REQUIRED: 'Category name is required',
};