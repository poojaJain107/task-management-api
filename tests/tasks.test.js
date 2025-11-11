const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Task = require('../src/models/Task');
const jwt = require('jsonwebtoken');
const config = require('../src/config/config');

describe('Task Routes', () => {
  let userToken;
  let userId;
  let user2Token;
  let user2Id;

  beforeEach(async () => {
    // Create first user
    const user = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
    });
    userId = user._id;
    userToken = jwt.sign({ id: userId }, config.jwtSecret, {
      expiresIn: config.jwtExpire,
    });

    // Create second user
    const user2 = await User.create({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'password123',
    });
    user2Id = user2._id;
    user2Token = jwt.sign({ id: user2Id }, config.jwtSecret, {
      expiresIn: config.jwtExpire,
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Task',
          description: 'This is a test task',
          priority: 'high',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.task.title).toBe('Test Task');
      expect(response.body.task.createdBy._id).toBe(userId.toString());
    });

    it('should not create task without title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'No title',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should not create task with short title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'AB',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should not create task without authentication', async () => {
      const response = await request(app).post('/api/tasks').send({
        title: 'Test Task',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should create task with all fields', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Complete Task',
          description: 'Full task with all fields',
          priority: 'high',
          status: 'in-progress',
          dueDate: '2025-12-31',
          assignedTo: user2Id,
          tags: ['urgent', 'important'],
        });

      expect(response.status).toBe(201);
      expect(response.body.task.priority).toBe('high');
      expect(response.body.task.tags).toContain('urgent');
    });
  });

  describe('GET /api/tasks', () => {
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
        {
          title: 'Task 3',
          createdBy: user2Id,
          priority: 'medium',
        },
      ]);
    });

    it('should get all tasks for authenticated user', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=pending')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks.every((t) => t.status === 'pending')).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=high')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks.every((t) => t.priority === 'high')).toBe(true);
    });

    it('should not get tasks without authentication', async () => {
      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks/:taskId', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Test Task',
        createdBy: userId,
      });
      taskId = task._id;
    });

    it('should get single task', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.task._id).toBe(taskId.toString());
    });

    it('should not get non-existent task', async () => {
      const fakeId = '000000000000000000000000';
      const response = await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should not allow other user to access task they do not own', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/tasks/:taskId', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Test Task',
        createdBy: userId,
      });
      taskId = task._id;
    });

    it('should update task', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Task',
          priority: 'high',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.task.title).toBe('Updated Task');
      expect(response.body.task.priority).toBe('high');
    });

    it('should not update task created by another user', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Hacked Task',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should not update without authentication', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: 'Updated Task',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/tasks/:taskId', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Test Task',
        createdBy: userId,
      });
      taskId = task._id;
    });

    it('should delete task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedTask = await Task.findById(taskId);
      expect(deletedTask).toBeNull();
    });

    it('should not delete task created by another user', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/tasks/:taskId/complete', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Test Task',
        status: 'pending',
        createdBy: userId,
      });
      taskId = task._id;
    });

    it('should mark task as completed', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.task.status).toBe('completed');
      expect(response.body.task.completedAt).toBeDefined();
    });

    it('should not complete task created by another user', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
