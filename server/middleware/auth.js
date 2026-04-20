const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'jobtrack_secret_change_in_production';

/**
 * Middleware: Verifies JWT from Authorization header.
 * Attaches decoded user { id, email, name } to req.user.
 */
const protect = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided. Access denied.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, name }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

module.exports = { protect };
