import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Listing extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
  bookId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Seller', required: true })
  sellerId!: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, min: 0 })
  mrp!: number;

  @Prop({ required: true, min: 0, default: 0 })
  stock!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const ListingSchema = SchemaFactory.createForClass(Listing);

ListingSchema.index({ bookId: 1, sellerId: 1 }, { unique: true });
ListingSchema.index({ sellerId: 1, isActive: 1 });
ListingSchema.index({ bookId: 1, isActive: 1 });