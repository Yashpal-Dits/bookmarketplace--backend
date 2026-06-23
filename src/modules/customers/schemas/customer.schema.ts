import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CustomerStatus } from '../../../common/enums/customer-status.enum';

@Schema({ timestamps: true })
export class Customer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ trim: true })
  lastName?: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop()
  mobileNumber?: string;

  @Prop()
  addressLine?: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  pincode?: string;

  @Prop()
  profileImage?: string;

  @Prop()
  bio?: string;

  @Prop()
  gender?: string;

  @Prop()
  dob?: string;

  @Prop({ type: String, enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  status!: CustomerStatus;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.index({ email: 1 });
CustomerSchema.index({ status: 1 });