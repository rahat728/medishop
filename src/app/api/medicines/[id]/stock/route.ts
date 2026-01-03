import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Medicine } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import {
    successResponse,
    errorResponse,
    serverErrorResponse,
    notFoundResponse,
} from '@/lib/api-response';

// =============================================================================
// Types
// =============================================================================

interface StockUpdateBody {
    action: 'set' | 'add' | 'subtract';
    quantity: number;
    reason?: string;
}

// =============================================================================
// PUT /api/medicines/[id]/stock - Update stock (admin only)
// =============================================================================

export const PUT = withAdmin(async (request, { user, params }) => {
    try {
        await connectDB();

        const id = params?.id;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse('Invalid medicine ID', 400);
        }

        const body: StockUpdateBody = await request.json();
        const { action, quantity, reason } = body;

        // Validate input
        if (!action || !['set', 'add', 'subtract'].includes(action)) {
            return errorResponse('Invalid action. Use: set, add, subtract', 400);
        }

        if (typeof quantity !== 'number' || quantity < 0) {
            return errorResponse('Quantity must be a non-negative number', 400);
        }

        // Find medicine
        const medicine = await Medicine.findById(id);

        if (!medicine) {
            return notFoundResponse('Medicine not found');
        }

        // Calculate new stock
        let newStock: number;

        switch (action) {
            case 'set':
                newStock = quantity;
                break;
            case 'add':
                newStock = medicine.stock + quantity;
                break;
            case 'subtract':
                newStock = medicine.stock - quantity;
                if (newStock < 0) {
                    return errorResponse(
                        `Cannot subtract ${quantity}. Current stock is ${medicine.stock}`,
                        400
                    );
                }
                break;
            default:
                return errorResponse('Invalid action', 400);
        }

        // Update stock
        const previousStock = medicine.stock;
        medicine.stock = newStock;
        await medicine.save();

        // Log the stock update (in a real app, you'd save this to a StockLog collection)
        console.log(`📦 Stock updated: ${medicine.name}`);
        console.log(`   Previous: ${previousStock} → New: ${newStock}`);
        console.log(`   Action: ${action}, Quantity: ${quantity}`);
        console.log(`   Reason: ${reason || 'Not specified'}`);
        console.log(`   By: ${user.email}`);

        return successResponse({
            medicine: {
                _id: medicine._id,
                name: medicine.name,
                previousStock,
                newStock,
                action,
                quantity,
            },
            message: `Stock updated from ${previousStock} to ${newStock}`,
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
});

// =============================================================================
// GET /api/medicines/[id]/stock - Get stock history (admin only)
// =============================================================================

export const GET = withAdmin(async (request, { user, params }) => {
    try {
        await connectDB();

        const id = params?.id;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse('Invalid medicine ID', 400);
        }

        const medicine = await Medicine.findById(id)
            .select('name stock lowStockThreshold')
            .lean();

        if (!medicine) {
            return notFoundResponse('Medicine not found');
        }

        // In a real app, you'd fetch from a StockLog collection
        // For now, return current stock info
        return successResponse({
            medicine: {
                _id: medicine._id,
                name: medicine.name,
                currentStock: medicine.stock,
                lowStockThreshold: medicine.lowStockThreshold,
                status: medicine.stock === 0
                    ? 'out_of_stock'
                    : medicine.stock <= medicine.lowStockThreshold
                        ? 'low_stock'
                        : 'in_stock',
            },
            // Placeholder for stock history
            history: [],
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
});
