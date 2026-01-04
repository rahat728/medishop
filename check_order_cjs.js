const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define minimal schema
const OrderSchema = new mongoose.Schema({
    orderNumber: String,
    status: String
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
        console.log('Connected to DB');

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
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkOrder();
