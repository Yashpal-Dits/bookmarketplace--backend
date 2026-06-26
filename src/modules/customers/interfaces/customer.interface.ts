export interface ICustomer {
  _id: string;
  userId: string;
  firstName: string;
  lastName?: string;
  email: string;
  mobileNumber?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  profileImage?: string;
  bio?: string;
  gender?: string;
  dob?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateCustomerPayload {
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  profileImage?: string;
}