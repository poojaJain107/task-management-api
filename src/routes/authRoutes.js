const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const uploadProfilePictureMiddleware = require('../middleware/upload');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', protect, authController.getCurrentUser);
router.put('/update-profile', protect, authController.updateProfile);
router.post('/upload-profile-picture', protect, uploadProfilePictureMiddleware, authController.uploadProfilePicture);

module.exports = router;
