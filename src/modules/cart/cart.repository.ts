import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Cart } from "./schemas/cart.schema";
import { CartItem } from "./schemas/cart-item.schema";

@Injectable()
export class CartRepository {
    private readonly logger = new Logger(CartRepository.name);

    constructor(
        @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
        @InjectModel(CartItem.name) private readonly cartItemModel: Model<CartItem>
    ) { }

    async findCartByCustomer(customerId: string): Promise<Cart | null> {
        try {
            return await this.cartModel.findOne({
                customerId
            }).exec()
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown';
            this.logger.error(`Fins cart failed: ${msg}`, error instanceof Error ? error.stack : undefined);

            throw error;
        }
    }


    async findCartItems(cartId: string): Promise<CartItem[]> {
        try {
            return await this.cartItemModel.find({ cartId }).exec();
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown';
            this.logger.error(`Find cart items failed: ${msg}`, error instanceof Error ? error.stack : undefined);
            throw error;
        }
    }

    async createCart(customerId: string): Promise<Cart> {
        try {
            return await this.cartModel.create({ customerId });
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown';
            this.logger.error(`Create cart failed: ${msg}`, error instanceof Error ? error.stack : undefined);

            throw error;
        }
    }

    async findCartItemByListing(cartId: string, listingId: string): Promise<CartItem | null> {

        try {
            return await this.cartItemModel.findOne({
                cartId, listingId
            }).exec();
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown';
            this.logger.error(`Find cartitem failed:${msg}`, error instanceof Error ? error.stack : undefined);

            throw error;
        }

    }

    async addCartItem(cartId: string, listingId: string, quantity: number): Promise<CartItem> {

        try {
            return await this.cartItemModel.create({ cartId, listingId, quantity });
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown';
            this.logger.error(`Add cart item failed: ${msg}`, error instanceof Error ? error.stack : undefined)

            throw error;

        }
    }

    async updateQuantity(itemId: string, quantity: number): Promise<CartItem | null> {

        try {
            return await this.cartItemModel.findByIdAndUpdate(itemId, { quantity }, { new: true }).exec();
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown';
            this.logger.error(`Update quantitiy failed: ${msg}`, error instanceof Error ? error.stack : undefined)

            throw error;
        }
    }

    async removeCartItem(itemId: string): Promise<CartItem | null> {

        try {
            return await
                this.cartItemModel.findByIdAndDelete(itemId).exec();
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown';
            this.logger.error(`Remove cart item failed: ${msg}`, error instanceof Error ? error.stack : undefined)

            throw error;
        }
    }

    async clearCart(cartId: string): Promise<void> {
        try {
            await this.cartItemModel.deleteMany({ cartId }).exec();
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown'
            this.logger.error(`Clear cart failed: ${msg}`, error instanceof Error ? error.stack : undefined)

            throw error;
        }
    }


}

