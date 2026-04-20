const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    createApplication,
    getApplications,
    updateApplication,
    deleteApplication,
} = require('../controllers/applicationController');

// All routes require authentication
router.post('/', protect, createApplication);
router.get('/', protect, getApplications);
router.put('/:id', protect, updateApplication);
router.delete('/:id', protect, deleteApplication);

module.exports = router;
