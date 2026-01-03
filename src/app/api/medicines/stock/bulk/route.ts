import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import { Medicine } from '@/lib/db/models';
import { withAdmin } from '@/lib/auth';
import {
    successResponse,
    errorResponse,
    serverErrorResponse,
} from '@/lib/api-response';

// =============================================================================
// Types
// =============================================================================

interface BulkStockUpdate {
    id: string;
    action: 'set' | 'add' | 'subtract';
    quantity: number;
}

// =============================================================================
// POST /api/medicines/stock/bulk - Bulk stock update (admin only)
// =============================================================================

export const POST = withAdmin(async (request, { user }) => {
    try {
        await connectDB();

        const { updates, reason }: { updates: BulkStockUpdate[]; reason?: string } =
            await request.json();

        if (!Array.isArray(updates) || updates.length === 0) {
            return errorResponse('Please provide an array of stock updates', 400);
        }

        // Validate all updates
        for (const update of updates) {
            if (!mongoose.Types.ObjectId.isValid(update.id)) {
                return errorResponse(`Invalid medicine ID: ${update.id}`, 400);
            }
            if (!['set', 'add', 'subtract'].includes(update.action)) {
                return errorResponse(`Invalid action for ${update.id}: ${update.action}`, 400);
            }
            if (typeof update.quantity !== 'number' || update.quantity < 0) {
                return errorResponse(`Invalid quantity for ${update.id}`, 400);
            }
        }

        const results: Array<{
            id: string;
            name: string;
            success: boolean;
            previousStock?: number;
            newStock?: number;
            error?: string;
        }> = [];

        // Process each update
        for (const update of updates) {
            try {
                const medicine = await Medicine.findById(update.id);

                if (!medicine) {
                    results.push({
                        id: update.id,
                        name: 'Unknown',
                        success: false,
                        error: 'Medicine not found',
                    });
                    continue;
                }

                const previousStock = medicine.stock;
                let newStock: number;

                switch (update.action) {
                    case 'set':
                        newStock = update.quantity;
                        break;
                    case 'add':
                        newStock = medicine.stock + update.quantity;
                        break;
                    case 'subtract':
                        newStock = medicine.stock - update.quantity;
                        if (newStock < 0) {
                            results.push({
                                id: update.id,
                                name: medicine.name,
                                success: false,
                                previousStock,
                                error: `Cannot subtract ${update.quantity}. Current stock is ${medicine.stock}`,
                            });
                            continue;
                        }
                        break;
                    default:
                        newStock = medicine.stock;
                }

                medicine.stock = newStock;
                await medicine.save();

                results.push({
                    id: update.id,
                    name: medicine.name,
                    success: true,
                    previousStock,
                    newStock,
                });
            } catch (error: any) {
                results.push({
                    id: update.id,
                    name: 'Unknown',
                    success: false,
                    error: error.message,
                });
            }
        }

        const successCount = results.filter((r) => r.success).length;
        const failCount = results.filter((r) => !r.success).length;

        console.log(`📦 Bulk stock update by ${user.email}`);
        console.log(`   Success: ${successCount}, Failed: ${failCount}`);
        console.log(`   Reason: ${reason || 'Not specified'}`);

        return successResponse({
            results,
            summary: {
                total: updates.length,
                success: successCount,
                failed: failCount,
            },
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
});
