const jwt = require('jsonwebtoken');
const env = require('../config/env');
const prisma = require('../config/prisma');
const User = require('../models/User');

async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Missing authentication token.' });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    let user = null;

    // 1. Try Prisma DB User lookup
    try {
      const pUser = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true },
      });
      if (pUser && pUser.isActive) {
        user = {
          id: pUser.id,
          name: `${pUser.firstName} ${pUser.lastName}`.trim(),
          email: pUser.email,
          role: pUser.role?.name?.toLowerCase() || payload.role || 'admin',
          isActive: pUser.isActive,
        };
      }
    } catch (_) {}

    // 2. Fallback to Mongoose User lookup
    if (!user) {
      try {
        const mUser = await User.findById(payload.sub).select('-passwordHash');
        if (mUser && mUser.isActive) {
          user = {
            id: mUser._id.toString(),
            name: mUser.name,
            email: mUser.email,
            role: mUser.role,
            isActive: mUser.isActive,
          };
        }
      } catch (_) {}
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid or inactive account.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = { requireAdmin };
