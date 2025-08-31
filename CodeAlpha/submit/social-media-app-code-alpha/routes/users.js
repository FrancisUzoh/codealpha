const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/users'); // Ensure this path is correct

// --- User Registration Endpoint ---

// --- Get user by ID ---
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password'); // don’t return password
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        } else 
        return res.json(user);
        
    } catch (err) {
        console.error('Fetch user error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});


router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Input validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username, email, and password'
            });
        }

        // Check if the user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create a new user instance
        // Assuming your Mongoose model has a 'pre-save' hook to hash the password.
        // This is a cleaner approach than hashing directly in the route.
        user = new User({ username, email, password });
        await user.save();

        // Create a JSON Web Token (JWT)
        const payload = {
            user: {
                id: user.id,
                username: user.username
            }
        };

        // Use environment variable for JWT secret
        const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';

        // Sign the token
        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) {
                    console.error('JWT signing error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error creating token'
                    });
                }

                res.status(201).json({
                    success: true,
                    message: "User created and logged in successfully",
                    token, // Send the token to the client
                    user: {
                        username: user.username,
                        email: user.email,
                        id: user.id
                    }
                });
            }
        );
    } catch (err) {
        console.error('Registration error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// --- User Login Endpoint ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create JWT payload
        const payload = {
            user: {
                id: user.id,
                username: user.username
            }
        };

        // Use environment variable for JWT secret
        const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';

        // Sign and return JWT
        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) {
                    console.error('JWT signing error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error creating token'
                    });
                }

                res.json({
                    success: true,
                    token,
                    message: 'Logged in successfully',
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    }
                });
            }
        );
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

module.exports = router;