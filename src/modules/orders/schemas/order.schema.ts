import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { OrderStatus } from "../../../common/enums";


@Schema({ timestamps: true })
export class Order extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
    customerId!: Types.ObjectId;

    @Prop({ type: Object, required: true })
    shippingAddress!: {
        fullName: string;
        mobileNumber: string;
        addressLine: string;
        city: string;
        state: string;
        pincode: string;
    };

    @Prop({ required: true, min: 0 })
    totalAmount!: number;


    @Prop({ type: String, enum: OrderStatus, default: OrderStatus.CREATED })
    status!: OrderStatus;
}
export const OrderSchema =
    SchemaFactory.createForClass(Order);
OrderSchema.index({ customerId: 1 })
OrderSchema.index({ status: 1 });