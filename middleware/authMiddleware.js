
const jwt = require('jsonwebtoken');
const User = require('../Models/User');


const protect = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
       
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user; 
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};


const admin = (req, res, next) => {
   
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized, admin access only' });
    }
    next(); 
};

module.exports = { protect, admin };