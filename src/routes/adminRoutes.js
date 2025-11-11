const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(protect, admin);

// Task routes (read-only)
router.get('/tasks', adminController.getAllTasksAdmin);
router.get('/tasks/:taskId', adminController.getTaskAdmin);
router.get('/tasks/user/:userId', adminController.getTasksByUser);

// User routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUser);

// Statistics
router.get('/statistics', adminController.getTaskStatistics);

module.exports = router;
