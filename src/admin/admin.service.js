const Property = require('../properties/property.schema');

class AdminService {
  async getAllProperties() {
    return Property.find().populate('owner', 'name email');
  }

  async approveProperty(id) {
    return Property.findByIdAndUpdate(id, { approved: true }, { new: true });
  }

  async rejectProperty(id) {
    return Property.findByIdAndDelete(id);
  }
}

module.exports = new AdminService();