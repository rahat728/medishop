const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define minimal schema
const OrderSchema = new mongoose.Schema({
    orderNumber: String,
    deliveryAddress: mongoose.Schema.Types.Mixed
});

// Avoid OverwriteModelError
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

async function checkOrder() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI missing');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);

        const orderNumber = 'ORD-20260103-44CHIU';
        const order = await Order.findOne({ orderNumber }).lean();

        if (order) {
            console.log('Address:', JSON.stringify(order.deliveryAddress, null, 2));
        } else {
            console.log('Order NOT FOUND');
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkOrder();
