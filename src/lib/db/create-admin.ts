import mongoose from 'mongoose';
import connectDB from './mongoose';
import { User } from './models';

/**
 * Bootstrap an admin user in the database
 * Usage: npx tsx --env-file=.env.local src/lib/db/create-admin.ts <email> <password> <name>
 */
async function createAdmin() {
    const [, , email, password, name] = process.argv;

    if (!email || !password || !name) {
        console.error('❌ Usage: npx tsx --env-file=.env.local src/lib/db/create-admin.ts <email> <password> <name>');
        process.exit(1);
    }

    try {
        console.log(`🚀 Creating admin user: ${email}...`);
        await connectDB();

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.log(`⚠️  User with email ${email} already exists.`);
            console.log('🔄 Promoting existing user to admin...');
            existingUser.role = 'admin';
            existingUser.isActive = true;
            await existingUser.save();
            console.log('✅ User promoted to admin successfully!');
        } else {
            const adminUser = new User({
                email: email.toLowerCase(),
                password,
                name,
                role: 'admin',
                isActive: true
            });

            await adminUser.save();
            console.log('✅ Admin user created successfully!');
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

createAdmin();
