// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../Models/User');

// Protect middleware to check if the user is authenticated
const protect = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Decode token to get user info
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user; // Attach user to request object
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Admin middleware to check if the logged-in user is an admin
const admin = (req, res, next) => {
    // Check if user has the admin role
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized, admin access only' });
    }
    next(); // Proceed to the next middleware/route handler if admin
};

module.exports = { protect, admin };