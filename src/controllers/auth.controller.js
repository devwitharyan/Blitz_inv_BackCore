const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/user.model');
const { jwtSecret } = require('../config/env');

const providerModel = require('../models/provider.model');
const customerModel = require('../models/customer.model');

exports.register = async (req, res) => {
  try {
    const { name, email, mobile, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required',
      });
    }

    const existingUser = await userModel.findByEmailOrMobile(email, mobile);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email or mobile already exists',
      });
    }

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser = await userModel.create({
      id,
      name,
      email,
      mobile,
      passwordHash,
      role,
    });
    
    if (role === 'provider') {
      await providerModel.create(id);
    } else if (role === 'customer') {
      await customerModel.create(id);
    }

    const token = jwt.sign({ id, role }, jwtSecret, { expiresIn: '7d' });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: newUser, token },
    });

  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    if (!emailOrMobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile, and password are required',
      });
    }

    const user = await userModel.findByEmailOrMobile(emailOrMobile, emailOrMobile);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isValid = bcrypt.compareSync(password, user.PasswordHash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = jwt.sign(
      { id: user.Id, role: user.Role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      data: { user, token },
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: err.message,
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const fullData = await userModel.getFullProfile(userId); 

    if (!fullData || !fullData.user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const responseData = {
      ...fullData.user,
      profile: fullData.profile
    };
    
    delete responseData.PasswordHash;

    return res.json({
      success: true,
      message: 'Profile fetched successfully',
      data: responseData,
    });

  } catch (err) {
    console.error("Get Profile error:", err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: err.message,
    });
  }
};

// NEW: Update FCM Token
exports.updateFcmToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ success: false, message: 'Token required' });
        
        await userModel.updateFcmToken(req.user.id, token);
        return res.json({ success: true, message: 'FCM Token updated' });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};