/* Usage: npm run seed:admin -- "Admin Name" admin@example.com "StrongPassword123!" */
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');

async function main() {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.error('Usage: npm run seed:admin -- "Admin Name" admin@example.com "StrongPassword123!"');
    process.exit(1);
  }

  await mongoose.connect(env.mongoUri);
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    process.exit(0);
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role: 'superadmin' });
  console.log('Created admin:', user.email);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
