const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { register, login, me } = require('../controllers/authController');
const { requireAdmin } = require('../middleware/auth');

// Login brute-force protection — was completely unrated before, meaning an attacker
// could try unlimited passwords against any known admin email. 10 attempts per 15
// minutes per IP is generous for a real admin who mistyped a password, but useless for
// a password-spray attack. Relies on the trust-proxy setting in app.js (see the
// deployment guide) to see the real client IP instead of Nginx's.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Please wait a few minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, login);
// requireAdmin here is the actual fix for a real, currently-exploitable gap: this route
// had NO auth check at all, and every new account defaults to role 'admin' (User.js) —
// meaning anyone who found this endpoint could self-register a full admin account with
// access to every exam, candidate recording, and question bank. The very first admin
// account is created via `npm run seed:admin` (see the deployment guide), not through
// this route, so gating it behind an existing admin's token doesn't break bootstrapping
// — it just means only an already-logged-in admin can invite more admins, matching what
// the controller's own comment always said was intended.
router.post('/register', requireAdmin, register);
router.get('/me', requireAdmin, me);

module.exports = router;
