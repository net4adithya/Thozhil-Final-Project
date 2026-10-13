const bcrypt = require('bcrypt');

// Handles user login
async function loginUser(email, password, usersDb) {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  const user = usersDb.find(u => u.email === email);
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return { success: false, error: 'Incorrect password' };
  }

  return { success: true, userId: user.id };
}

// Handles new user signup
async function signupUser(email, password, usersDb) {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  const existingUser = usersDb.find(u => u.email === email);
  if (existingUser) {
    return { success: false, error: 'Email already registered' };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = { id: usersDb.length + 1, email, passwordHash };
  usersDb.push(newUser);

  return { success: true, userId: newUser.id };
}

module.exports = { loginUser, signupUser };