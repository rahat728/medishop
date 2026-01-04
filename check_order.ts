import connectDB from '@/lib/db/mongoose';
import { Order } from '@/lib/db/models';

async function checkOrder() {
    await connectDB();
    const orderNumber = 'ORD-20260103-44CHIU';
    const order = await Order.findOne({ orderNumber }).lean();

    if (order) {
        console.log('FOUND:', order.orderNumber);
        console.log('ID:', order._id);
    } else {
        console.log('NOT FOUND:', orderNumber);

        // Try fuzzy
        const fuzzy = await Order.findOne({ orderNumber: /ORD-20260103-44CHIU/ }).lean();
        if (fuzzy) {
            console.log('FOUND VIA FUZZY:', fuzzy.orderNumber);
        }
    }
    process.exit(0);
}

checkOrder();
