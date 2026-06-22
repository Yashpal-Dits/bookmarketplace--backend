import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Book extends Document {
  @Prop({ required: true, trim: true, index: true })
  title!: string;

  @Prop({ required: true, trim: true, index: true })
  author!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category!: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seller!: Types.ObjectId;

  @Prop({ default: 0, min: 0 })
  stock!: number;

  @Prop({ default: true })
  isAvailable!: boolean;

  @Prop()
  isbn?: string;

  @Prop()
  publisher?: string;

  @Prop()
  publishedYear?: number;

  @Prop()
  language?: string;

  @Prop()
  pageCount?: number;
}

export const BookSchema = SchemaFactory.createForClass(Book);

// Compound indexes for common queries
BookSchema.index({ title: 'text', author: 'text', description: 'text' });
BookSchema.index({ seller: 1, isAvailable: 1 });
BookSchema.index({ category: 1, isAvailable: 1 });
BookSchema.index({ price: 1 });