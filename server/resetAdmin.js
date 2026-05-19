import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js'; 

const resetAdmin = async () => {
  try {
    // 1. Connect
    const mongoURI = process.env.MONGODB_URI; // <-- Change this if needed";
    console.log('🔌 Connecting...');
    await mongoose.connect(mongoURI);
    
    // 2. DELETE OLD ADMIN (The Fix)
    console.log('🗑️  Deleting old Super Admin...');
    await User.findOneAndDelete({ email: 'awakeningjuniorgroup@gmail.com' });

    // 3. CREATE NEW ADMIN
    console.log('🆕 Creating fresh Super Admin...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@321', salt); 

    const superAdmin = new User({
      name: 'awakening junior group',
      email: 'awakeningjuniorgroup@gmail.com',
      password: hashedPassword,
      role: 'superadmin',
      isVerified: true
    });

    await superAdmin.save();
    console.log('✅ SUCCESS: Super Admin has been reset!');
    
    process.exit();

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetAdmin();