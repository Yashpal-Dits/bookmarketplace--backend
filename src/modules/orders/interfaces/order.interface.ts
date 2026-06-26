import { Types } from 'mongoose';

export interface ShippingAddress {
  fullName: string;
  mobileNumber: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IOrder {
  _id: string;
  customerId: string;
  shippingAddress: ShippingAddress;
  totalAmount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  _id: string;
  orderId: string;
  listingId: string;
  bookId: string;
  sellerId: string;
  bookTitle: string;
  sellerName: string;
  priceAtPurchase: number;
  quantity: number;
  subtotal: number;
  status: string;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaceOrderPayload {
  shippingAddress: ShippingAddress;
}

export interface OrderDetailed extends IOrder {
  items: IOrderItem[];
}

export interface OrderItemDetailed extends IOrderItem {
  order?: IOrder;
  customer?: any;
}