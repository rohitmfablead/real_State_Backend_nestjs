const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../users/user.schema');

class AuthService {
  async register(data) {
    const hashed = await bcrypt.hash(data.password, 10);
    return User.create({ ...data, password: hashed });
  }

  async login(email, password) {
    const user = await User.findOne({ email });
    if (!user) throw new Error("Invalid credentials");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid credentials");

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token, user };
  }
}

module.exports = new AuthService();