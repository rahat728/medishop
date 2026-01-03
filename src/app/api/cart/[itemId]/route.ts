import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Cart, Medicine } from '@/lib/db/models';
import { withAuth } from '@/lib/auth';
import {
    successResponse,
    errorResponse,
    serverErrorResponse,
    notFoundResponse,
} from '@/lib/api-response';

// =============================================================================
// PUT /api/cart/[itemId] - Update item quantity
// =============================================================================

interface Context {
    params: Promise<{ itemId: string }>;
}

export const PUT = withAuth(async (request, { user }, context: Context) => {
    try {
        const { itemId } = await context.params;
        await connectDB();

        const { quantity } = await request.json();

        if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
            return errorResponse('Invalid item ID', 400);
        }

        if (typeof quantity !== 'number' || quantity < 0) {
            return errorResponse('Invalid quantity', 400);
        }

        const cart = await Cart.findOne({ user: user.id });

        if (!cart) {
            return notFoundResponse('Cart not found');
        }

        const itemIndex = cart.items.findIndex(
            (item: any) => item.medicine.toString() === itemId
        );

        if (itemIndex === -1) {
            return notFoundResponse('Item not found in cart');
        }

        if (quantity === 0) {
            // Remove item
            cart.items.splice(itemIndex, 1);
        } else {
            // Check stock
            const medicine = await Medicine.findById(itemId);

            if (!medicine) {
                return notFoundResponse('Medicine not found');
            }

            if (quantity > medicine.stock) {
                return errorResponse(`Only ${medicine.stock} items available`, 400);
            }

            cart.items[itemIndex].quantity = quantity;
        }

        await cart.save();

        return successResponse({
            message: quantity === 0 ? 'Item removed from cart' : 'Quantity updated',
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
});

// =============================================================================
// DELETE /api/cart/[itemId] - Remove item from cart
// =============================================================================

export const DELETE = withAuth(async (request, { user }, context: Context) => {
    try {
        const { itemId } = await context.params;
        await connectDB();

        if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
            return errorResponse('Invalid item ID', 400);
        }

        const cart = await Cart.findOne({ user: user.id });

        if (!cart) {
            return notFoundResponse('Cart not found');
        }

        const itemIndex = cart.items.findIndex(
            (item: any) => item.medicine.toString() === itemId
        );

        if (itemIndex === -1) {
            return notFoundResponse('Item not found in cart');
        }

        cart.items.splice(itemIndex, 1);
        await cart.save();

        return successResponse({ message: 'Item removed from cart' });
    } catch (error) {
        return serverErrorResponse(error);
    }
});
