export const SUCCESS_MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'Registration successful',
  LOGOUT_SUCCESS: 'Logout successful',
  EMAIL_VERIFIED: 'Email verified successfully',
  OTP_SENT: 'OTP sent successfully to your email',
  PASSWORD_RESET: 'Password reset successful',
  PASSWORD_CHANGED: 'Password changed successfully',

  // Customers
  CUSTOMER_CREATED: 'Customer registered successfully',
  CUSTOMER_FETCHED: 'Customer profile fetched successfully',
  CUSTOMER_UPDATED: 'Customer profile updated successfully',
  CUSTOMER_ACTIVATED: 'Customer activated successfully',

  // Sellers
  SELLER_REGISTERED: 'Seller registration submitted. Awaiting admin approval.',
  SELLER_FETCHED: 'Seller profile fetched successfully',
  SELLER_UPDATED: 'Seller profile updated successfully',
  SELLER_APPROVED: 'Seller approved successfully',
  SELLER_REJECTED: 'Seller rejected',

  // categories 
   CATEGORY_CREATED: 'Category created successfully',
  CATEGORY_FETCHED: 'Category fetched successfully',
  CATEGORIES_FETCHED: 'Categories fetched successfully',
  CATEGORY_UPDATED: 'Category updated successfully',
  CATEGORY_DELETED: 'Category deleted successfully',

  // Books
  BOOK_CREATED: 'Book request submitted for approval',
  BOOK_FETCHED: 'Book fetched successfully',
  BOOKS_FETCHED: 'Books fetched successfully',
  BOOK_APPROVED: 'Book approved successfully',
  BOOK_REJECTED: 'Book rejected',
  BOOK_UPDATED: 'Book updated successfully',
  BOOK_DELETED: 'Book deleted successfully',

  // Listings
  LISTING_CREATED: 'Listing created successfully',
  LISTING_FETCHED: 'Listing fetched successfully',
  LISTINGS_FETCHED: 'Listings fetched successfully',
  LISTING_UPDATED: 'Listing updated successfully',

  // Cart
  CART_ITEM_ADDED: 'Item added to cart',
  CART_ITEM_UPDATED: 'Cart item updated',
  CART_ITEM_REMOVED: 'Item removed from cart',
  CART_CLEARED: 'Cart cleared',

  // Orders
  ORDER_CREATED: 'Order placed successfully',
  ORDER_FETCHED: 'Order fetched successfully',
  ORDERS_FETCHED: 'Orders fetched successfully',
  ORDER_STATUS_UPDATED: 'Order status updated',

  // Admin
  DASHBOARD_FETCHED: 'Dashboard data fetched successfully',

  // Newsletter
  SUBSCRIBED: 'Successfully subscribed to newsletter',

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
  USER_NOT_FOUND: 'User not found',

  // Registration
  CUSTOMER_ALREADY_EXISTS: 'A customer with this email already exists',
  SELLER_ALREADY_EXISTS: 'A seller with this email already exists',

  // Customers
  CUSTOMER_NOT_FOUND: 'Customer not found',
  CUSTOMER_BLOCKED: 'Your account has been blocked. Please contact support.',
  CUSTOMER_NOT_ACTIVE: 'Customer account is not active',

  // Sellers
  SELLER_NOT_FOUND: 'Seller not found',
  SELLER_NOT_APPROVED: 'Only approved sellers can perform this action',
  SELLER_PENDING: 'Your seller account is pending approval',
  SELLER_REJECTED: 'Your seller application has been rejected',
  NOT_YOUR_LISTING: 'You cannot modify another seller\'s listing',
  
// category 
  CATEGORY_NOT_FOUND: 'Category not found',
  CATEGORY_NOT_DELETED: 'Category has associated books, cannot delete',

  // Books
  BOOK_NOT_FOUND: 'Book not found',
  BOOK_NOT_APPROVED: 'You can only list approved books',
  BOOK_NOT_CREATED: 'Failed to create book request',
  BOOK_NOT_UPDATED: 'Failed to update book',
  BOOK_NOT_DELETED: 'Failed to delete book',
  BOOK_OUT_OF_STOCK: 'Book is out of stock',
  ISBN_ALREADY_EXISTS: 'A book with this ISBN already exists',

  // Listings
  LISTING_NOT_FOUND: 'Listing not found',
  LISTING_NOT_ACTIVE: 'This listing is no longer available',
  LISTING_ALREADY_EXISTS: 'You already have a listing for this book',
  LISTING_OUT_OF_STOCK: 'This seller is out of stock',

  // Cart
  CART_NOT_FOUND: 'Cart not found',
  CART_ITEM_NOT_FOUND: 'Cart item not found',
  CART_EMPTY: 'Your cart is empty',
  QUANTITY_EXCEEDS_STOCK: 'Only {{stock}} left in stock',
  QUANTITY_MIN: 'Quantity must be at least 1',

  // Orders
  ORDER_NOT_FOUND: 'Order not found',
  ORDER_NOT_CREATED: 'Failed to create order',
  ORDER_CANNOT_CANCEL: 'Order cannot be cancelled in its current state',

  // Admin
  ONLY_ADMIN: 'Only admins can perform this action',

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