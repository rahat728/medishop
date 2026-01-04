import connectDB from '@/lib/db/mongoose';
import { Order, Medicine } from '@/lib/db/models';

const RESTOCK_NOTE = 'Inventory restocked';

export async function restockOrderItems(orderId: string) {
  await connectDB();

  const order = await Order.findById(orderId).select('items status statusHistory').lean();
  if (!order) {
    throw new Error('Order not found');
  }

  // Idempotency: if already restocked, do nothing
  const already = (order.statusHistory || []).some(
    (h: any) => typeof h?.note === 'string' && h.note.includes(RESTOCK_NOTE)
  );
  if (already) {
    return { restocked: false, message: 'Already restocked' };
  }

  const items = (order.items || []).filter((it: any) => it?.medicine && it?.quantity > 0);

  // Restock medicines
  for (const item of items) {
    await Medicine.updateOne(
      { _id: item.medicine },
      { $inc: { stock: item.quantity } }
    );
  }

  // Record restock in statusHistory using current status (must match enum)
  await Order.updateOne(
    { _id: orderId },
    {
      $push: {
        statusHistory: {
          status: order.status,
          timestamp: new Date(),
          note: RESTOCK_NOTE,
        },
      },
    }
  );

  return { restocked: true, count: items.length };
}
