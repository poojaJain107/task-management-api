const Task = require('../models/Task');
const User = require('../models/User');

// Admin: Get all tasks (read-only)
const getAllTasksAdmin = async (req, res, next) => {
  try {
    const { status, priority, userId, sortBy = '-createdAt' } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (userId) filter.createdBy = userId;

    const tasks = await Task.find(filter).sort(sortBy);

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get single task (read-only)
const getTaskAdmin = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all users
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get user by ID
const getUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get tasks by user
const getTasksByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, priority, sortBy = '-createdAt' } = req.query;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const filter = { createdBy: userId };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter).sort(sortBy);

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get task statistics
const getTaskStatistics = async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats = await Task.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalTasks = await Task.countDocuments();
    const totalUsers = await User.countDocuments();

    res.status(200).json({
      success: true,
      statistics: {
        totalTasks,
        totalUsers,
        tasksByStatus: stats,
        tasksByPriority: priorityStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTasksAdmin,
  getTaskAdmin,
  getAllUsers,
  getUser,
  getTasksByUser,
  getTaskStatistics,
};
