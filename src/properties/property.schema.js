const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  city: String,
  area: Number,
  bedrooms: Number,
  furnished: Boolean,
  type: String,
  images: [String],
  approved: { type: Boolean, default: false },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Property', PropertySchema);