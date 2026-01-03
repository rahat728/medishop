import connectDB from '@/lib/db/mongoose';
import { Cart, Medicine } from '@/lib/db/models';
import { withAuth } from '@/lib/auth';
import {
    successResponse,
    errorResponse,
    serverErrorResponse,
} from '@/lib/api-response';
import mongoose from 'mongoose';

// =============================================================================
// GET /api/cart - Get user's cart
// =============================================================================

export const GET = withAuth(async (request, { user }) => {
    try {
        await connectDB();

        let cart = await Cart.findOne({ user: user.id })
            .populate({
                path: 'items.medicine',
                select: 'name slug price compareAtPrice image manufacturer category stock isActive',
            })
            .lean();

        if (!cart) {
            return successResponse({
                items: [],
                itemCount: 0,
                subtotal: 0,
            });
        }

        // Filter out inactive or deleted medicines
        const validItems = cart.items.filter(
            (item: any) => item.medicine && item.medicine.isActive
        );

        // Calculate totals
        const itemCount = validItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
        const subtotal = validItems.reduce(
            (sum: number, item: any) => sum + item.medicine.price * item.quantity,
            0
        );

        return successResponse({
            items: validItems.map((item: any) => ({
                _id: item.medicine._id.toString(),
                name: item.medicine.name,
                slug: item.medicine.slug,
                price: item.medicine.price,
                compareAtPrice: item.medicine.compareAtPrice,
                image: item.medicine.image,
                manufacturer: item.medicine.manufacturer,
                category: item.medicine.category,
                stock: item.medicine.stock,
                quantity: item.quantity,
            })),
            itemCount,
            subtotal,
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
});

// =============================================================================
// POST /api/cart - Add item to cart
// =============================================================================

export const POST = withAuth(async (request, { user }) => {
    try {
        await connectDB();

        const { medicineId, quantity = 1 } = await request.json();

        if (!medicineId || !mongoose.Types.ObjectId.isValid(medicineId)) {
            return errorResponse('Invalid medicine ID', 400);
        }

        if (quantity < 1) {
            return errorResponse('Quantity must be at least 1', 400);
        }

        // Check medicine exists and has stock
        const medicine = await Medicine.findById(medicineId);

        if (!medicine || !medicine.isActive) {
            return errorResponse('Medicine not found', 404);
        }

        if (medicine.stock < quantity) {
            return errorResponse(`Only ${medicine.stock} items available`, 400);
        }

        // Get or create cart
        let cart = await (Cart as any).findOne({ user: user.id });

        if (!cart) {
            cart = new Cart({ user: user.id, items: [] });
        }

        // Check if item already in cart
        const existingItemIndex = cart.items.findIndex(
            (item: any) => item.medicine.toString() === medicineId
        );

        if (existingItemIndex > -1) {
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;

            if (newQuantity > medicine.stock) {
                return errorResponse(`Only ${medicine.stock} items available`, 400);
            }

            cart.items[existingItemIndex].quantity = newQuantity;
        } else {
            cart.items.push({
                medicine: medicineId,
                quantity,
                addedAt: new Date(),
            });
        }

        await cart.save();

        return successResponse({
            message: 'Item added to cart',
            itemCount: cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
});

// =============================================================================
// DELETE /api/cart - Clear cart
// =============================================================================

export const DELETE = withAuth(async (request, { user }) => {
    try {
        await connectDB();

        await Cart.findOneAndUpdate(
            { user: user.id },
            { $set: { items: [] } }
        );

        return successResponse({ message: 'Cart cleared' });
    } catch (error) {
        return serverErrorResponse(error);
    }
});
