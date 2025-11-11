const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect, userOnly, admin } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// User routes
router.post('/', userOnly, taskController.createTask);
router.get('/', taskController.getAllTasks);
router.get('/:taskId', taskController.getTask);
router.put('/:taskId', userOnly, taskController.updateTask);
router.delete('/:taskId', userOnly, taskController.deleteTask);
router.patch('/:taskId/complete', userOnly, taskController.completeTask);

module.exports = router;
