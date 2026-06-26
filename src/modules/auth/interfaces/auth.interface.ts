// ─── Payloads ─────────────────────────────────────
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterCustomerPayload {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  mobileNumber?: string;
}

export interface RegisterSellerPayload {
  businessName: string;
  contactPerson: string;
  email: string;
  password: string;
  mobileNumber: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface SendOtpPayload {
  email: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

// ─── Responses ────────────────────────────────────
export interface UserResponse {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  role: string;
  profileImage?: string;
}

export interface CustomerProfileBrief {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  status: string;
}

export interface SellerProfileBrief {
  _id: string;
  businessName: string;
  contactPerson: string;
  email: string;
  status: string;
}

export interface TokenPair {
  token: string;
  refreshToken: string;
}

export interface LoginData {
  user: UserResponse;
  token: string;
  refreshToken: string;
  customerId?: string;
  sellerId?: string;
  status?: string;
  sellerStatus?: string;
}

export interface RegisterCustomerData {
  user: UserResponse;
  customer: CustomerProfileBrief;
  token: string;
  refreshToken: string;
}

export interface RegisterSellerData {
  user: UserResponse;
  seller: SellerProfileBrief;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenData {
  accessToken: string;
  refreshToken: string;
}

// ─── API Response Wrappers ─────────────────────────
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: LoginData;
}

export interface RegisterCustomerResponse {
  success: boolean;
  message: string;
  data: RegisterCustomerData;
}

export interface RegisterSellerResponse {
  success: boolean;
  message: string;
  data: RegisterSellerData;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: RefreshTokenData;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}