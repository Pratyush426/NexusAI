const User = require('../models/User');

// POST /api/users/sync
// Upsert user profile data (called when user logs in or updates profile)
exports.syncUser = async (req, res) => {
    try {
        // req.user is set by the protect middleware (from JWT)
        const userId = req.user.id;
        const { full_name, resume_url, linkedin_url, gmail_connected } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    name: full_name,
                    resume_url,
                    linkedin_url,
                    gmail_connected
                }
            },
            { new: true, setDefaultsOnInsert: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            user: updatedUser
        });

    } catch (err) {
        console.error('Sync user error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/users/profile
// Get the current user's profile (from JWT, no email query param needed)
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const profile = {
            id: user._id,
            user_id: user._id,
            email: user.email,
            full_name: user.name,
            resume_url: user.resume_url || null,
            linkedin_url: user.linkedin_url || null,
            gmail_connected: user.gmail_connected || false,
            created_at: user.createdAt,
            updated_at: user.createdAt
        };

        res.status(200).json({ success: true, profile });

    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};
