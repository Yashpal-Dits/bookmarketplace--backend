import { Schema } from 'mongoose';
import { applyVirtualId } from './schema.helper';

export const DealSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        endsAt: {
            type: String,
            required: true
        },
        bookIds: [{
            type: Schema.Types.ObjectId,
            ref: 'Book'
        }],
    },
    { timestamps: true },
);

applyVirtualId(DealSchema);
