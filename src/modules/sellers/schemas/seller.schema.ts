import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SellerStatus } from '../../../common/enums/seller-status.enum';

@Schema({ timestamps: true })
export class Seller extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  businessName!: string;

  @Prop({ required: true, trim: true })
  contactPerson!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  mobileNumber!: string;

  @Prop({ type: String, enum: SellerStatus, default: SellerStatus.PENDING })
  status!: SellerStatus;

  @Prop()
  businessAddress?: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  pincode?: string;

  @Prop()
  storeLogo?: string;
}

export const SellerSchema = SchemaFactory.createForClass(Seller);

SellerSchema.index({ email: 1 });
SellerSchema.index({ status: 1 });