import mongoose from 'mongoose';
import connectDB from './mongoose';
import { User } from './models';

async function checkUsers() {
    try {
        console.log('🔍 Checking database users...\n');

        await connectDB();
        console.log('📦 Connected to MongoDB\n');

        const userCount = await User.countDocuments();
        console.log(`📊 Total users: ${userCount}`);

        if (userCount === 0) {
            console.log('❌ No users found in the database.');
        } else {
            const users = await User.find({}, 'email role isActive');
            console.log('\n👥 Existing Users:');
            console.table(users.map(u => ({
                email: u.email,
                role: u.role,
                isActive: u.isActive,
                id: u._id.toString()
            })));
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        if (userCount > 0) {
            const admin = await User.findOne({ role: 'admin' });
            if (admin) {
                console.log('✅ Admin user exists!');
            } else {
                console.log('⚠️  Admin user NOT found!');
            }
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Check error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('📦 Database connection closed');
        process.exit(0);
    }
}

checkUsers();
