const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/user.model');
const { jwtSecret } = require('../config/env');
const providerModel = require('../models/provider.model');
const customerModel = require('../models/customer.model');
const { success, error } = require('../utils/response');

exports.register = async (req, res) => {
  try {
    const { name, email, mobile, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return error(res, 'Name, email, password, and role are required', 400);
    }

    const existingUser = await userModel.findByEmailOrMobile(email, mobile);

    if (existingUser) {
      return error(res, 'A user with this email or mobile already exists', 409);
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

    return success(res, { user: newUser, token }, 'User registered successfully', 201);

  } catch (err) {
    console.error("Registration error:", err);
    return error(res, err.message);
  }
};

exports.login = async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    if (!emailOrMobile || !password) {
      return error(res, 'Email or mobile, and password are required', 400);
    }

    const user = await userModel.findByEmailOrMobile(emailOrMobile, emailOrMobile);

    if (!user) {
      return error(res, 'User not found', 404);
    }

    // Check if account is active (Soft Delete Check)
    if (!user.IsActive) {
        return error(res, 'This account has been deactivated.', 403);
    }

    const isValid = bcrypt.compareSync(password, user.PasswordHash);

    if (!isValid) {
      return error(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign(
      { id: user.Id, role: user.Role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return success(res, { user, token }, 'Login successful');

  } catch (err) {
    console.error("Login error:", err);
    return error(res, err.message);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const fullData = await userModel.getFullProfile(userId); 

    if (!fullData || !fullData.user) {
      return error(res, 'User not found', 404);
    }

    const responseData = {
      ...fullData.user,
      profile: fullData.profile
    };
    
    delete responseData.PasswordHash;

    return success(res, responseData, 'Profile fetched successfully');

  } catch (err) {
    console.error("Get Profile error:", err);
    return error(res, err.message);
  }
};

exports.updateFcmToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return error(res, 'Token required', 400);
        
        await userModel.updateFcmToken(req.user.id, token);
        return success(res, null, 'FCM Token updated');
    } catch (err) {
        return error(res, err.message);
    }
};

// --- Change Password ---
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await userModel.findById(userId);
    if (!user) return error(res, 'User not found', 404);

    const isValid = bcrypt.compareSync(oldPassword, user.PasswordHash);
    if (!isValid) {
      return error(res, 'Incorrect old password', 400);
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await userModel.updatePassword(userId, newHash);

    return success(res, null, 'Password updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

// --- Delete Account (Soft Delete) ---
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body; 

    const user = await userModel.findById(userId);
    if (!user) return error(res, 'User not found', 404);

    const isValid = bcrypt.compareSync(password, user.PasswordHash);
    if (!isValid) return error(res, 'Incorrect password', 400);

    await userModel.updateStatus(userId, false); // Set IsActive = 0

    return success(res, null, 'Account deactivated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};