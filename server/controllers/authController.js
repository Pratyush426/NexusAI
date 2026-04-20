const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'jobtrack_secret_change_in_production';
const JWT_EXPIRES_IN = '7d';

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        // Hash password with bcrypt (10 salt rounds)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        const token = generateToken(newUser);

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
            },
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        if (!user.password) {
            return res.status(400).json({ message: 'This account has no password set. Please register again.' });
        }

        // Check if stored password is a bcrypt hash (starts with $2a$ or $2b$)
        const isBcryptHash = user.password.startsWith('$2');

        let isMatch = false;

        if (isBcryptHash) {
            // Normal bcrypt comparison
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            // Legacy: plain text password from old system
            isMatch = (user.password === password);

            // Auto-upgrade: hash the password now so future logins use bcrypt
            if (isMatch) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(password, salt);
                await user.save();
                console.log(`[Auth] Upgraded password to bcrypt for: ${email}`);
            }
        }

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        const token = generateToken(user);

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/auth/me  — returns the current user from token
exports.getMe = async (req, res) => {
    try {
        // req.user is set by the protect middleware
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ user });
    } catch (err) {
        console.error('GetMe error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
