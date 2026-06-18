import { Schema } from 'mongoose';
import { applyVirtualId } from './schema.helper';

export const CartItemSchema = new Schema(
    {
        cartId: {
            type: Schema.Types.ObjectId,
            ref: 'Cart',
            required: true
        },
        listingId: {
            type: Schema.Types.ObjectId,
            ref: 'Listing',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
    },
    { timestamps: true },
);

applyVirtualId(CartItemSchema);
CartItemSchema.index({ cartId: 1 });
CartItemSchema.index({ cartId: 1, listingId: 1 }, { unique: true });
