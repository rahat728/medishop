import mongoose from 'mongoose';
import path from 'path';
import connectDB from './mongoose';
import { User, Medicine, Order } from './models';

// Load environment variables if not using --env-file (optional fallback)
// dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Types (simplified for seed script)
const ORDER_STATUSES = [
    'pending', 'confirmed', 'assigned', 'picked_up', 'on_the_way', 'delivered', 'cancelled'
];

async function seedOrders() {
    try {
        console.log('Connecting to MongoDB...');
        await connectDB();
        console.log('Connected!');

        const customers = await User.find({ role: 'customer' }); // 'user' role is 'customer' in seed.ts
        const deliveryMen = await User.find({ role: 'delivery' }); // 'delivery_man' is 'delivery' in seed.ts
        const medicines = await Medicine.find();

        console.log(`Debug: Found ${customers.length} customers`);
        console.log(`Debug: Found ${deliveryMen.length} delivery men`);
        console.log(`Debug: Found ${medicines.length} medicines`);

        if (customers.length === 0 || medicines.length === 0) {
            console.error('Error: No customers or medicines found.');
            // Fallback: If no customers with role 'customer', try 'user' or just all users
            const allUsers = await User.find();
            console.log(`Debug: Total users in DB: ${allUsers.length}`);
            process.exit(1);
        }

        console.log(`Found ${customers.length} customers, ${deliveryMen.length} delivery men, ${medicines.length} medicines.`);
        console.log('Clearing existing orders...');
        await Order.deleteMany({});

        console.log('Generating orders...');
        const orders = [];
        const numOrders = 50;

        for (let i = 0; i < numOrders; i++) {
            const customer = customers[Math.floor(Math.random() * customers.length)];

            // Generate standard order details
            const numItems = Math.floor(Math.random() * 4) + 1;
            const orderItems = [];
            let subtotal = 0;

            for (let j = 0; j < numItems; j++) {
                const medicine = medicines[Math.floor(Math.random() * medicines.length)];
                const quantity = Math.floor(Math.random() * 3) + 1;
                const itemSubtotal = medicine.price * quantity;

                orderItems.push({
                    medicine: medicine._id,
                    name: medicine.name,
                    price: medicine.price,
                    quantity,
                    subtotal: itemSubtotal
                });
                subtotal += itemSubtotal;
            }

            const deliveryFee = 5.00;
            const tax = subtotal * 0.1; // 10% tax
            const totalAmount = subtotal + deliveryFee + tax;

            // Determine status flow logic to make data realistic
            const statusIndex = Math.floor(Math.random() * ORDER_STATUSES.length);
            const currentStatus = ORDER_STATUSES[statusIndex];
            let assignedDeliveryMan = null;

            if (['assigned', 'picked_up', 'on_the_way', 'delivered'].includes(currentStatus) && deliveryMen.length > 0) {
                assignedDeliveryMan = deliveryMen[Math.floor(Math.random() * deliveryMen.length)]._id;
            }

            // Generate history
            const statusHistory = [];
            const baseTime = new Date();
            baseTime.setDate(baseTime.getDate() - Math.floor(Math.random() * 30)); // Last 30 days

            // All orders start as pending
            let currentTime = new Date(baseTime);
            statusHistory.push({
                status: 'pending',
                timestamp: new Date(currentTime),
                note: 'Order placed'
            });

            // Simulate timeline up to current status
            const validStatuses = ['pending', 'confirmed', 'assigned', 'picked_up', 'on_the_way', 'delivered'];
            const targetIndex = validStatuses.indexOf(currentStatus);

            if (currentStatus !== 'cancelled') {
                for (let k = 1; k <= targetIndex; k++) {
                    currentTime.setMinutes(currentTime.getMinutes() + Math.random() * 120 + 30); // 30-150 mins later
                    statusHistory.push({
                        status: validStatuses[k],
                        timestamp: new Date(currentTime),
                        note: `Status updated to ${validStatuses[k]}`
                    });
                }
            } else {
                // Handle cancelled
                currentTime.setMinutes(currentTime.getMinutes() + Math.random() * 60 + 10);
                statusHistory.push({
                    status: 'cancelled',
                    timestamp: new Date(currentTime),
                    note: 'Order cancelled by system'
                });
            }

            orders.push({
                orderNumber: `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
                customer: customer._id,
                deliveryMan: assignedDeliveryMan,
                items: orderItems,
                subtotal,
                deliveryFee,
                tax,
                discount: 0,
                totalAmount,
                paymentMethod: Math.random() > 0.3 ? 'stripe' : 'cod',
                paymentStatus: currentStatus === 'delivered' ? 'paid' : (Math.random() > 0.5 ? 'paid' : 'pending'),
                deliveryAddress: {
                    street: '123 Main St',
                    city: 'New York',
                    state: 'NY',
                    zipCode: '10001',
                    // country removed not in schema
                },
                status: currentStatus,
                statusHistory,
                createdAt: baseTime,
                updatedAt: currentTime
            });
        }

        await Order.insertMany(orders);
        console.log(`Successfully seeded ${orders.length} orders!`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding orders:', error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`- ${key}: ${error.errors[key].message}`);
            });
        }
        process.exit(1);
    }
}

seedOrders();
