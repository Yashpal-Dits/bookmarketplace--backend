import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";


@Schema ({ timestamps: true})
export class CartItem extends Document {
    @Prop ({type: Types.ObjectId, ref: 'Cart', required: true})
    cartId!: Types.ObjectId;


    @Prop({ type : Types.ObjectId, ref: 'Listing', required: true})
    listingId!: Types.ObjectId;

    @Prop({ required: true, min: 1})
    quantity!: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);
CartItemSchema.index({cartId:1, listingId: 1}, {unique: true});