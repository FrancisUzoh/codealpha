// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/users');

const auth = async (req, res, next) => {
    try {
        console.log('=== AUTH MIDDLEWARE ===');
        console.log('Headers:', req.headers);

        const authHeader = req.header('Authorization');
        let token = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {

            token = authHeader.replace('Bearer ', '').trim();
        }


        if (!token) {
            console.log('No token provided');
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        console.log('Token found:', token.substring(0, 20) + '...');

        const jwtSecret = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, jwtSecret);

        console.log('Token decoded:', decoded);

        // Step 1: Query the database to find the user.
        // `User.findById(...)` is a Mongoose method to search by the document's unique ID.
        // `decoded.user.id` extracts the user's ID from the JWT payload.

        // Step 2: project the query results.
        // `.select('-password')` tells Mongoose to explicitly exclude the 'password' field
        // from the returned user document. This prevents sending sensitive data
        // to the client and is a key security best practice
        const user = await User.findById(decoded.user.id).select('-password');

        if (!user) {
            console.log(' User not found');
            return res.status(401).json({
                success: false,
                message: 'Token is not valid - user not found.'
            });
        }

        if (user) {
            req.user = {
                id: user._id,
                username: user.username,
                email: user.email
            };
        }
    
        
        console.log('User authenticated:', req.user);
        next();
        
    } catch(error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Token is not valid.'
        });
    }
};

module.exports = auth;