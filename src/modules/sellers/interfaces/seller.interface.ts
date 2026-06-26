export interface ISeller {
  _id: string;
  userId: string;
  businessName: string;
  contactPerson: string;
  email: string;
  mobileNumber: string;
  status: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  storeLogo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateSellerPayload {
  businessName?: string;
  contactPerson?: string;
  mobileNumber?: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  storeLogo?: string;
}

export interface SellerStatusInfo {
  _id: string;
  businessName: string;
  status: string;
}