const mongoose = require('mongoose');

let isOfflineMode = process.env.FORCE_JSON_DB === 'true';

async function connectDB() {
  if (isOfflineMode) {
    console.log('⚠️ Forced Offline Mode: Using local JSON DB.');
    await seedDemoData();
    return;
  }

  try {
    const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/smartcare_v3';
    console.log(`Connecting to MongoDB at: ${connStr}...`);
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('✅ Connected to MongoDB.');
    isOfflineMode = false;
    await seedDemoData();
  } catch (err) {
    console.error('❌ MongoDB connection failed. Falling back to offline local JSON DB.', err.message);
    isOfflineMode = true;
    await seedDemoData();
  }
}

function getDbMode() {
  return isOfflineMode ? 'json' : 'mongo';
}

async function seedDemoData() {
  try {
    const User = require('../models/User');
    const Doctor = require('../models/Doctor');
    const { hashPassword } = require('./auth');

    const userCount = await User.countDocuments();
    if (userCount > 0) return;

    console.log('🌱 Seeding default demo accounts for testing...');
    const hp = await hashPassword('password123');

    const demoUsers = [
      { name: 'John Doe (Patient)', email: 'patient@smartcare.com', password: hp, role: 'patient' },
      { name: 'Dr. Robert Chen', email: 'doctor@smartcare.com', password: hp, role: 'doctor', department: 'Emergency', room: 'Room 101' },
      { name: 'Sarah Miller (Reception)', email: 'receptionist@smartcare.com', password: hp, role: 'receptionist' },
      { name: 'David Jones (Billing)', email: 'billing@smartcare.com', password: hp, role: 'billing' },
      { name: 'Emily Watson (Lab)', email: 'lab@smartcare.com', password: hp, role: 'lab' },
      { name: 'Frank Harris (Pharmacy)', email: 'pharmacy@smartcare.com', password: hp, role: 'pharmacy' }
    ];

    for (const u of demoUsers) {
      const created = await User.create({
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role
      });
      if (u.role === 'doctor') {
        await Doctor.create({
          userId: created._id,
          name: created.name,
          email: created.email,
          department: u.department,
          room: u.room,
          status: 'active',
          currentToken: 0
        });
      }
    }
    console.log('✅ Demo accounts seeded successfully.');
  } catch (err) {
    console.error('⚠️ Seeding demo accounts error:', err.message);
  }
}

module.exports = {
  connectDB,
  getDbMode
};
