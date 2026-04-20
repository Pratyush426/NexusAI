const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Both endpoints require a valid JWT
router.get('/profile', protect, userController.getUserProfile);
router.post('/sync', protect, userController.syncUser);

module.exports = router;
