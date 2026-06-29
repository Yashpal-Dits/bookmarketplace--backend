import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BookStatus } from '../../../common/enums/book-status.enum';

@Schema()
export class BookImage {
  @Prop()
  filename?: string;

  @Prop()
  mimetype?: string;

  @Prop({ type: Buffer, required: true })
  data!: Buffer;

  @Prop()
  size?: number;
}

@Schema({ timestamps: true })
export class Book extends Document {
  @Prop({ required: true, trim: true })
  isbn!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  author!: string;

  @Prop({ trim: true })
  publisher?: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ type: [BookImage], default: [] })
  images?: BookImage[];

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  category?: Types.ObjectId;

  @Prop({ type: String, enum: BookStatus, default: BookStatus.PENDING })
  status!: BookStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBySellerId?: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  rating?: number;

  @Prop({ type: Number, default: null })
  minPrice?: number | null;

  @Prop({ type: Number, default: null })
  mrp?: number | null;

  @Prop({ type: Number, default: 0 })
  totalStock?: number;
}

export const BookSchema = SchemaFactory.createForClass(Book);
BookSchema.index({ isbn: 1 });
BookSchema.index({ status: 1 });
BookSchema.index({ category: 1 });
BookSchema.index({ title: 'text', author: 'text', description: 'text' });