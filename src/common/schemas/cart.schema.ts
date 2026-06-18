import { Schema } from 'mongoose';
import { applyVirtualId } from './schema.helper';

export const CartSchema = new Schema(
    {
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
        },
    },
    { timestamps: true },
);

applyVirtualId(CartSchema);
CartSchema.index({ customerId: 1 }, { unique: true });
