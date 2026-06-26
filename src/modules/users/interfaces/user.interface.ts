export interface IUser {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  role: string;
  mobileNumber?: string;
  profileImage?: string;
  otp?: string;
  otpExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}