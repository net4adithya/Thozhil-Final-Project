const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const User = require('../models/User');
const env = require('../config/env');

function signToken(id, role) {
  return jwt.sign({ sub: id, role: role || 'admin' }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

// POST /api/auth/register (intended for initial setup / superadmin-invited admins only)
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('name, email and password are required.');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Try Prisma User Registration
  try {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      res.status(409);
      throw new Error('An account with this email already exists.');
    }

    const targetRoleName = (role || 'ADMIN').toUpperCase();
    let roleObj = await prisma.role.findUnique({ where: { name: targetRoleName } });
    if (!roleObj) {
      roleObj = await prisma.role.findFirst();
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const names = name.trim().split(' ');
    const firstName = names[0] || name;
    const lastName = names.slice(1).join(' ') || '';

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName,
        lastName,
        roleId: roleObj.id,
        isActive: true,
      },
      include: { role: true },
    });

    const userRole = newUser.role?.name?.toLowerCase() || 'admin';
    return res.status(201).json({
      user: { id: newUser.id, name: `${newUser.firstName} ${newUser.lastName}`.trim(), email: newUser.email, role: userRole },
      token: signToken(newUser.id, userRole),
    });
  } catch (err) {
    if (err.status === 409 || err.message.includes('already exists')) {
      throw err;
    }
  }

  // 2. Mongoose Fallback Registration
  const existingMongo = await User.findOne({ email: normalizedEmail });
  if (existingMongo) {
    res.status(409);
    throw new Error('An account with this email already exists.');
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email: normalizedEmail, passwordHash });

  res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token: signToken(user._id.toString(), user.role),
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('email and password are required.');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Try Prisma DB Login
  try {
    const pUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { role: true },
    });

    if (pUser && pUser.isActive) {
      const match = await bcrypt.compare(password, pUser.passwordHash);
      if (match) {
        const userRole = pUser.role?.name?.toLowerCase() || 'admin';
        return res.json({
          user: {
            id: pUser.id,
            name: `${pUser.firstName} ${pUser.lastName}`.trim(),
            email: pUser.email,
            role: userRole,
          },
          token: signToken(pUser.id, userRole),
        });
      }
    }
  } catch (_) {}

  // 2. Mongoose Fallback Login
  try {
    const mUser = await User.findOne({ email: normalizedEmail });
    if (mUser && (await mUser.comparePassword(password))) {
      return res.json({
        user: { id: mUser._id, name: mUser.name, email: mUser.email, role: mUser.role },
        token: signToken(mUser._id.toString(), mUser.role),
      });
    }
  } catch (_) {}

  res.status(401);
  throw new Error('Invalid credentials.');
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { register, login, me };
