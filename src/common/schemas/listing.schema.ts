import { Schema } from 'mongoose';
import { applyVirtualId } from './schema.helper';

export const ListingSchema = new Schema(
    {
        bookId: {
            type: Schema.Types.ObjectId,
            ref: 'Book',
            required: true
        },
        sellerId: {
            type: Schema.Types.ObjectId,
            ref: 'Seller',
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        mrp: {
            type: Number,
            required: true,
            min: 0
        },
        stock: {
            type: Number,
            required: true,
            min: 0
        },
        isActive: {
            type: Boolean,
            default: true
        },
    },
    { timestamps: true },
);

applyVirtualId(ListingSchema);
ListingSchema.index({ bookId: 1, sellerId: 1 }, { unique: true });
ListingSchema.index({ sellerId: 1 });
ListingSchema.index({ bookId: 1, isActive: 1 });
