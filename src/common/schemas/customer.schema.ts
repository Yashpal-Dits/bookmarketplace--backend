import { Schema } from 'mongoose';
import { applyVirtualId } from './schema.helper';

export const CustomerSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        mobileNumber: {
            type: String,
            trim: true
        },
        addressLine: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        },
        pincode: {
            type: String,
            trim: true
        },
        profileImage: {
            type: String,
            default: ''
        },
        bio: { type: String },
        gender: { type: String },
        dob: { type: String },
        nationalId: { type: String },
        country: { type: String },
        taxId: { type: String },
        status: {
            type: String,
            enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'],
            default: 'ACTIVE',
        },
    },
    { timestamps: true },
);

applyVirtualId(CustomerSchema);
CustomerSchema.index({ userId: 1 });
