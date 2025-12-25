const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// API Routes prefix
const apiRouter = express.Router();
app.use('/api', apiRouter);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ['user', 'owner', 'admin'],
    default: 'user'
  },
  phone: String,
  address: String,
  profileImage: String,
  likedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Property Schema
const propertySchema = new mongoose.Schema({
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
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const Property = mongoose.model('Property', propertySchema);

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Auth Routes
apiRouter.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      phone,
      address
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ token, user: { id: user._id, name, email, role, phone, address } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role, phone: user.phone, address: user.address } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

apiRouter.post('/auth/logout', (req, res) => {
  // For JWT tokens, logout is typically handled on the client side
  // This endpoint can be used to perform any server-side cleanup if needed
  res.json({ message: 'Logged out successfully' });
});

// User Profile Routes
apiRouter.get('/users/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

apiRouter.put('/users/me', verifyToken, async (req, res) => {
  try {
    const { name, email, phone, address, profileImage } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, phone, address, profileImage },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Property Routes
apiRouter.get('/properties', async (req, res) => {
  try {
    // Get query parameters for filtering
    const { city, type, minPrice, maxPrice, bedrooms } = req.query;
    
    let query = { approved: true };
    
    if (city) query.city = new RegExp(city, 'i');
    if (type) query.type = new RegExp(type, 'i');
    if (minPrice) query.price = { ...query.price, $gte: Number(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: Number(maxPrice) };
    if (bedrooms) query.bedrooms = Number(bedrooms);
    
    const properties = await Property.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
      
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

apiRouter.get('/properties/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('owner', 'name email');
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

apiRouter.post('/properties', verifyToken, async (req, res) => {
  try {
    const property = new Property({
      ...req.body,
      owner: req.user.id
    });
    
    await property.save();
    res.status(201).json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Like/Dislike Property Routes
apiRouter.post('/properties/:id/like', verifyToken, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    // Check if property is already liked
    const isLiked = user.likedProperties.includes(req.params.id);
    
    if (isLiked) {
      // Unlike the property
      await Property.findByIdAndUpdate(req.params.id, {
        $pull: { likedBy: userId }
      });
      
      await User.findByIdAndUpdate(userId, {
        $pull: { likedProperties: req.params.id }
      });
      
      res.json({ message: 'Property unliked', liked: false });
    } else {
      // Like the property
      await Property.findByIdAndUpdate(req.params.id, {
        $addToSet: { likedBy: userId }
      });
      
      await User.findByIdAndUpdate(userId, {
        $addToSet: { likedProperties: req.params.id }
      });
      
      res.json({ message: 'Property liked', liked: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get liked properties for a user
apiRouter.get('/users/me/liked-properties', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('likedProperties');
    res.json(user.likedProperties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all likes for a property
apiRouter.get('/properties/:id/likes', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('likedBy', 'name email');
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json({
      count: property.likedBy.length,
      users: property.likedBy
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all liked properties (new API to address the issue)
apiRouter.get('/properties/liked', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'likedProperties',
      populate: {
        path: 'owner',
        select: 'name email'
      }
    });
    
    res.json(user.likedProperties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Routes
apiRouter.get('/admin/properties', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') }
      ];
    }
    
    if (status === 'approved') query.approved = true;
    if (status === 'pending') query.approved = false;
    
    const total = await Property.countDocuments(query);
    const properties = await Property.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    res.json({
      properties,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

apiRouter.get('/admin/users', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    
    if (role) query.role = role;
    
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

apiRouter.post('/admin/properties/:id/approve', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    ).populate('owner', 'name email');
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

apiRouter.post('/admin/properties/:id/reject', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json({ message: 'Property rejected and deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dashboard Routes
apiRouter.get('/admin/dashboard', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  try {
    const totalUsers = await User.countDocuments();
    const totalProperties = await Property.countDocuments();
    const approvedProperties = await Property.countDocuments({ approved: true });
    const pendingProperties = await Property.countDocuments({ approved: false });
    
    // Get recent activities
    const recentProperties = await Property.find()
      .populate('owner', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
      
    const recentUsers = await User.find()
      .select('name email')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      totalUsers,
      totalProperties,
      approvedProperties,
      pendingProperties,
      recentProperties,
      recentUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});