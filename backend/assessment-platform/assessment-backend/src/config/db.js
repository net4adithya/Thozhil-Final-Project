const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('./env');
const prisma = require('./prisma');

async function connectDB() {
  // 1. Prisma Foundation Connection & Seeding
  try {
    await prisma.$connect();
    console.log('[db] Prisma Database connected successfully');

    // Ensure baseline Roles exist
    const roles = ['SUPERADMIN', 'ADMIN', 'AUTHORITY', 'RECRUITER', 'MANAGER', 'INTERN'];
    for (const r of roles) {
      await prisma.role.upsert({
        where: { name: r },
        update: {},
        create: {
          name: r,
          description: `${r} role for Thozhil platform`,
          permissions: JSON.stringify(['*']),
        },
      });
    }

    // Auto-provision default authority admin account in Prisma
    const defaultEmail = 'authority@platform.com';
    const defaultPass = 'admin123';
    const superadminRole = await prisma.role.findUnique({ where: { name: 'SUPERADMIN' } });

    if (superadminRole) {
      const defaultUser = await prisma.user.findUnique({ where: { email: defaultEmail } });
      const passwordHash = await bcrypt.hash(defaultPass, 10);

      if (!defaultUser) {
        await prisma.user.create({
          data: {
            email: defaultEmail,
            passwordHash,
            firstName: 'Platform',
            lastName: 'Authority',
            roleId: superadminRole.id,
            isActive: true,
          },
        });
        console.log(`[db] Created default Prisma authority admin: ${defaultEmail}`);
      }
    }
  } catch (prismaErr) {
    console.warn('[db] Prisma DB connection warning:', prismaErr.message);
  }

  // 2. Mongoose Fallback Connection (if mongoUri is provided)
  if (env.mongoUri) {
    mongoose.set('strictQuery', true);
    try {
      await mongoose.connect(env.mongoUri);
      console.log(`[db] MongoDB connected: ${mongoose.connection.host}`);
      
      const User = require('../models/User');
      const defaultEmail = 'authority@platform.com';
      const defaultPass = 'admin123';
      let defaultUser = await User.findOne({ email: defaultEmail });
      if (!defaultUser) {
        const passwordHash = await User.hashPassword(defaultPass);
        defaultUser = await User.create({ name: 'Platform Authority', email: defaultEmail, passwordHash, role: 'superadmin' });
        console.log(`[db] Created default authority admin in Mongo: ${defaultEmail}`);
      } else {
        defaultUser.passwordHash = await User.hashPassword(defaultPass);
        await defaultUser.save();
      }
    } catch (err) {
      console.warn('[db] MongoDB connection skipped/failed:', err.message);
    }

    mongoose.connection.on('disconnected', () => {
      console.warn('[db] MongoDB disconnected');
    });
  }
}

module.exports = connectDB;
