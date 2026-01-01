import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from './mongoose';
import { User, Medicine } from './models';

// =============================================================================
// Sample Data
// =============================================================================

const users = [
  {
    name: 'Admin User',
    email: 'admin@meddelivery.com',
    password: 'admin123',
    role: 'admin',
    phone: '+1234567890',
  },
  {
    name: 'John Customer',
    email: 'customer@test.com',
    password: 'customer123',
    role: 'customer',
    phone: '+1234567891',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      coordinates: { lat: 40.7128, lng: -74.006 },
    },
  },
  {
    name: 'Mike Delivery',
    email: 'delivery@test.com',
    password: 'delivery123',
    role: 'delivery',
    phone: '+1234567892',
  },
  {
    name: 'Jane Delivery',
    email: 'delivery2@test.com',
    password: 'delivery123',
    role: 'delivery',
    phone: '+1234567893',
  },
];

const medicines = [
  // Pain Relief
  {
    name: 'Ibuprofen 200mg',
    description: 'Effective pain relief for headaches, muscle aches, and fever. Take with food to reduce stomach upset.',
    price: 8.99,
    compareAtPrice: 12.99,
    category: 'Pain Relief',
    stock: 150,
    manufacturer: 'PharmaCorp',
    activeIngredients: ['Ibuprofen 200mg'],
    dosage: 'Adults: 1-2 tablets every 4-6 hours',
    warnings: ['Do not exceed 6 tablets in 24 hours', 'Not for children under 12'],
    directions: 'Take with water and food',
    isFeatured: true,
  },
  {
    name: 'Acetaminophen 500mg',
    description: 'Fast-acting pain reliever and fever reducer. Gentle on the stomach.',
    price: 7.49,
    category: 'Pain Relief',
    stock: 200,
    manufacturer: 'HealthPlus',
    activeIngredients: ['Acetaminophen 500mg'],
    dosage: 'Adults: 1-2 tablets every 4-6 hours',
    warnings: ['Do not exceed 8 tablets in 24 hours', 'Avoid alcohol'],
    isFeatured: true,
  },
  {
    name: 'Aspirin 325mg',
    description: 'Classic pain relief with anti-inflammatory properties.',
    price: 5.99,
    category: 'Pain Relief',
    stock: 180,
    manufacturer: 'MediCare',
    activeIngredients: ['Aspirin 325mg'],
  },
  
  // Cold & Flu
  {
    name: 'DayQuil Cold & Flu',
    description: 'Multi-symptom relief for cold and flu. Non-drowsy formula.',
    price: 12.99,
    compareAtPrice: 15.99,
    category: 'Cold & Flu',
    stock: 80,
    manufacturer: 'ViruShield',
    activeIngredients: ['Acetaminophen', 'Dextromethorphan', 'Phenylephrine'],
    isFeatured: true,
  },
  {
    name: 'NyQuil Nighttime',
    description: 'Nighttime cold and flu relief. Helps you sleep.',
    price: 13.99,
    category: 'Cold & Flu',
    stock: 75,
    manufacturer: 'ViruShield',
    warnings: ['May cause drowsiness', 'Do not drive or operate machinery'],
  },
  {
    name: 'Throat Lozenges Honey Lemon',
    description: 'Soothing relief for sore throats. Natural honey lemon flavor.',
    price: 4.99,
    category: 'Cold & Flu',
    stock: 250,
    manufacturer: 'NatureCare',
  },
  
  // Digestive Health
  {
    name: 'Antacid Tablets',
    description: 'Fast relief from heartburn, acid indigestion, and upset stomach.',
    price: 6.99,
    category: 'Digestive Health',
    stock: 120,
    manufacturer: 'DigestWell',
    activeIngredients: ['Calcium Carbonate 750mg'],
    isFeatured: true,
  },
  {
    name: 'Probiotic Daily',
    description: 'Supports digestive health with 10 billion CFUs.',
    price: 19.99,
    compareAtPrice: 24.99,
    category: 'Digestive Health',
    stock: 60,
    manufacturer: 'BioFlora',
  },
  {
    name: 'Anti-Diarrheal',
    description: 'Fast relief from diarrhea symptoms.',
    price: 8.49,
    category: 'Digestive Health',
    stock: 90,
    manufacturer: 'DigestWell',
  },
  
  // Allergy
  {
    name: 'Loratadine 10mg',
    description: '24-hour non-drowsy allergy relief.',
    price: 14.99,
    category: 'Allergy',
    stock: 100,
    manufacturer: 'AllerFree',
    activeIngredients: ['Loratadine 10mg'],
    isFeatured: true,
  },
  {
    name: 'Diphenhydramine 25mg',
    description: 'Antihistamine for allergy symptoms and sleep aid.',
    price: 7.99,
    category: 'Allergy',
    stock: 85,
    manufacturer: 'AllerFree',
    warnings: ['May cause drowsiness'],
  },
  
  // First Aid
  {
    name: 'Adhesive Bandages Variety Pack',
    description: 'Assorted sizes for cuts and scrapes. Flexible fabric.',
    price: 5.49,
    category: 'First Aid',
    stock: 200,
    manufacturer: 'SafeHeal',
  },
  {
    name: 'Antibiotic Ointment',
    description: 'Prevents infection in minor cuts, scrapes, and burns.',
    price: 6.99,
    category: 'First Aid',
    stock: 150,
    manufacturer: 'SafeHeal',
    isFeatured: true,
  },
  {
    name: 'Hydrogen Peroxide 3%',
    description: 'Antiseptic for cleaning wounds.',
    price: 2.99,
    category: 'First Aid',
    stock: 180,
    manufacturer: 'CleanMed',
  },
  
  // Vitamins & Supplements
  {
    name: 'Vitamin D3 1000 IU',
    description: 'Supports bone health and immune function.',
    price: 9.99,
    category: 'Vitamins & Supplements',
    stock: 140,
    manufacturer: 'VitaLife',
  },
  {
    name: 'Multivitamin Daily',
    description: 'Complete daily nutrition with essential vitamins and minerals.',
    price: 15.99,
    compareAtPrice: 19.99,
    category: 'Vitamins & Supplements',
    stock: 100,
    manufacturer: 'VitaLife',
    isFeatured: true,
  },
  {
    name: 'Vitamin C 1000mg',
    description: 'Immune support and antioxidant protection.',
    price: 11.99,
    category: 'Vitamins & Supplements',
    stock: 160,
    manufacturer: 'VitaLife',
  },
  
  // Skin Care
  {
    name: 'Hydrocortisone Cream 1%',
    description: 'Relieves itching and skin irritation.',
    price: 7.49,
    category: 'Skin Care',
    stock: 110,
    manufacturer: 'DermaCare',
  },
  {
    name: 'Aloe Vera Gel',
    description: 'Soothing gel for sunburn and skin irritation.',
    price: 6.99,
    category: 'Skin Care',
    stock: 130,
    manufacturer: 'NatureCare',
  },
  
  // Eye Care
  {
    name: 'Lubricating Eye Drops',
    description: 'Relief for dry, irritated eyes.',
    price: 8.99,
    category: 'Eye Care',
    stock: 95,
    manufacturer: 'VisionCare',
  },
  
  // Oral Care
  {
    name: 'Antiseptic Mouthwash',
    description: 'Kills germs that cause bad breath and plaque.',
    price: 5.99,
    category: 'Oral Care',
    stock: 170,
    manufacturer: 'OralHealth',
  },
];

// =============================================================================
// Seed Function
// =============================================================================

async function seed() {
  try {
    console.log('🌱 Starting database seed...\n');
    
    await connectDB();
    console.log('📦 Connected to MongoDB\n');
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Medicine.deleteMany({});
    console.log('✅ Existing data cleared\n');
    
    // Seed users
    console.log('👥 Seeding users...');
    const createdUsers = [];
    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`   ✅ Created ${userData.role}: ${userData.email}`);
    }
    console.log('');
    
    // Seed medicines
    console.log('💊 Seeding medicines...');
    for (const medicineData of medicines) {
      await Medicine.create(medicineData);
      console.log(`   ✅ Created: ${medicineData.name}`);
    }
    console.log('');
    
    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • Users: ${users.length}`);
    console.log(`   • Medicines: ${medicines.length}`);
    console.log('');
    console.log('🔐 Test Accounts:');
    console.log('   Admin:    admin@meddelivery.com / admin123');
    console.log('   Customer: customer@test.com / customer123');
    console.log('   Delivery: delivery@test.com / delivery123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
  }
}

// Run if called directly
seed().catch(console.error);

export default seed;
