import { Schema } from 'mongoose';
import { applyVirtualId } from './schema.helper'

export const BookSchema = new Schema(
    {
        isbn: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },
        author: {
            type: String,
            required: true,
            trim: true
        },
        publisher: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        coverImage: {
            type: String,
            default: ''
        },
        category: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING',
        },
        createdBySellerId: {
            type: Schema.Types.ObjectId,
            ref: 'Seller'
        },
        rating: {
            type: Number,
            default: 0
        },
        minPrice: {
            type: Number,
            default: null
        },
        mrp: {
            type: Number,
            default: null
        },
        totalStock: {
            type: Number,
            default: 0
        },
    },
    { timestamps: true },
);


applyVirtualId(BookSchema);
BookSchema.index({ status: 1 });
BookSchema.index({ category: 1 });
BookSchema.index({
    title: 'text',
    author: 'text'
});
