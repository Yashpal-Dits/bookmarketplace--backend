import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { OrderStatus } from "../../../common/enums";


@Schema({ timestamps: true })
export class OrderItem extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
    orderId!: Types.ObjectId;


    @Prop({ type: Types.ObjectId, ref: 'Listing', required: true })
    listingId!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
    bookId!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Seller', required: true })
    sellerId!: Types.ObjectId

    @Prop({ required: true })
    bookTitle!: string;

    @Prop({ required: true })
    sellerName!: string;

    @Prop({ required: true })
    priceAtPurchase!: number

    @Prop({ required: true })
    quantity!: number;

    @Prop({ required: true, min: 0 })
    subtotal!: number;

    @Prop({ type: String, enum: OrderStatus, default: OrderStatus.CREATED })
    status!: OrderStatus;

    @Prop()
    coverImage?: string;

}

export const OrderItemSchema =
    SchemaFactory.createForClass(OrderItem);
OrderItemSchema.index({ orderId: 1 });
OrderItemSchema.index({ sellerId: 1 });