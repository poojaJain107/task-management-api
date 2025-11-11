const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Task = require('../src/models/Task');
const jwt = require('jsonwebtoken');
const config = require('../src/config/config');

describe('Admin Routes', () => {
  let adminToken;
  let adminId;
  let userToken;
  let userId;

  beforeEach(async () => {
    // Create admin user
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });
    adminId = admin._id;
    adminToken = jwt.sign({ id: adminId }, config.jwtSecret, {
      expiresIn: config.jwtExpire,
    });

    // Create regular user
    const user = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'user',
    });
    userId = user._id;
    userToken = jwt.sign({ id: userId }, config.jwtSecret, {
      expiresIn: config.jwtExpire,
    });
  });

  describe('GET /api/admin/tasks', () => {
    beforeEach(async () => {
      await Task.create([
        {
          title: 'Task 1',
          createdBy: userId,
          priority: 'high',
        },
        {
          title: 'Task 2',
          createdBy: userId,
          priority: 'low',
        },
      ]);
    });

    it('should allow admin to view all tasks', async () => {
      const response = await request(app)
        .get('/api/admin/tasks')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tasks.length).toBeGreaterThan(0);
    });

    it('should not allow regular user to access admin tasks', async () => {
      const response = await request(app)
        .get('/api/admin/tasks')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('admin');
    });

    it('should not allow non-authenticated user to access admin tasks', async () => {
      const response = await request(app).get('/api/admin/tasks');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should allow filtering tasks by status', async () => {
      const response = await request(app)
        .get('/api/admin/tasks?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks.every((t) => t.status === 'pending')).toBe(true);
    });
  });

  describe('GET /api/admin/tasks/:taskId', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Test Task',
        createdBy: userId,
      });
      taskId = task._id;
    });

    it('should allow admin to view single task', async () => {
      const response = await request(app)
        .get(`/api/admin/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.task._id).toBe(taskId.toString());
    });

    it('should not allow regular user to access admin task endpoint', async () => {
      const response = await request(app)
        .get(`/api/admin/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should allow admin to view all users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should not allow regular user to view all users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/users/:userId', () => {
    it('should allow admin to view single user', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user._id).toBe(userId.toString());
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '000000000000000000000000';
      const response = await request(app)
        .get(`/api/admin/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/tasks/user/:userId', () => {
    beforeEach(async () => {
      await Task.create([
        {
          title: 'User Task 1',
          createdBy: userId,
        },
        {
          title: 'User Task 2',
          createdBy: userId,
        },
      ]);
    });

    it('should allow admin to view tasks by specific user', async () => {
      const response = await request(app)
        .get(`/api/admin/tasks/user/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.tasks.every((t) => t.createdBy._id === userId.toString())).toBe(
        true
      );
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '000000000000000000000000';
      const response = await request(app)
        .get(`/api/admin/tasks/user/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/statistics', () => {
    beforeEach(async () => {
      await Task.create([
        {
          title: 'Task 1',
          status: 'pending',
          priority: 'high',
          createdBy: userId,
        },
        {
          title: 'Task 2',
          status: 'completed',
          priority: 'low',
          createdBy: userId,
        },
        {
          title: 'Task 3',
          status: 'in-progress',
          priority: 'high',
          createdBy: userId,
        },
      ]);
    });

    it('should allow admin to view task statistics', async () => {
      const response = await request(app)
        .get('/api/admin/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statistics.totalTasks).toBeGreaterThan(0);
      expect(response.body.statistics.totalUsers).toBeGreaterThan(0);
      expect(response.body.statistics.tasksByStatus).toBeDefined();
      expect(response.body.statistics.tasksByPriority).toBeDefined();
    });

    it('should not allow regular user to view statistics', async () => {
      const response = await request(app)
        .get('/api/admin/statistics')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Authorization tests', () => {
    it('admin should not be able to create tasks', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Task',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('admin');
    });

    it('admin should not be able to update tasks', async () => {
      const task = await Task.create({
        title: 'User Task',
        createdBy: userId,
      });

      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated by admin',
        });

      expect(response.status).toBe(403);
    });

    it('admin should not be able to delete tasks', async () => {
      const task = await Task.create({
        title: 'User Task',
        createdBy: userId,
      });

      const response = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
    });
  });
});
