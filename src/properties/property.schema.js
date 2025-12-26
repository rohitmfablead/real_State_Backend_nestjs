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
  location: {
    city: String,
    address: String,
    latitude: Number,
    longitude: Number
  },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isLiked: { type: Boolean, default: false },
  status: String,
  propertyType: String,
  
  approved: { type: Boolean, default: false },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Property', PropertySchema);