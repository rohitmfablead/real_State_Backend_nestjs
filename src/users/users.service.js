const User = require('./user.schema');

class UsersService {
  findByEmail(email) {
    return User.findOne({ email });
  }

  findById(id) {
    return User.findById(id);
  }
}

module.exports = new UsersService();