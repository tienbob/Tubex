import request from 'supertest';
import { expect } from 'chai';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../../src/database/ormconfig';
import { config } from '../../src/config';
import { User } from '../../src/database/models/sql';
import { redisClient } from '../../src/database';
// Import the app directly from the app.ts file
import { app } from '../../src/app';

// Add Mocha global function declarations
declare const describe: any;
declare const before: any;
declare const after: any;
declare const it: any;

describe('User API Integration Tests', () => {
  let authToken: string;
  let testUserId: string;
  const testUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    role: 'admin'
  };

  before(async () => {
    // Create a mock JWT token for authentication
    authToken = jwt.sign({ id: testUser.id }, config.jwt.secret as jwt.Secret, {
      expiresIn: '15m'
    });

    // Mock Redis to return the token
    sinon.stub(redisClient, 'get').resolves(authToken);

    // Initialize AppDataSource before tests
    await AppDataSource.initialize();

    // Create test user in the database
    const userRepository = AppDataSource.getRepository(User);
    const existingUser = await userRepository.findOne({ where: { email: testUser.email } });
    if (!existingUser) {
      const newUser = userRepository.create({
        id: testUser.id,
        email: testUser.email,
        password_hash: 'hashedpassword',
        role: testUser.role,
        status: 'active'
      });
      await userRepository.save(newUser);
    }
    testUserId = testUser.id;
  });

  after(async () => {
    // Clean up test data
    const userRepository = AppDataSource.getRepository(User);
    await userRepository.delete(testUserId);
    
    // Close the database connection
    await AppDataSource.destroy();
    
    // Restore stubs
    sinon.restore();
  });

  describe('GET /api/v1/users', () => {
    it('should return a list of users', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body.status).to.equal('success');
      expect(response.body.data).to.have.property('users');
      expect(response.body.data.users).to.be.an('array');
      expect(response.body.data).to.have.property('pagination');
    });
    
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/users');
      
      expect(response.status).to.equal(401);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return a user by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body.status).to.equal('success');
      expect(response.body.data).to.have.property('user');
      expect(response.body.data.user).to.have.property('id', testUserId);
      expect(response.body.data.user).to.have.property('email', testUser.email);
    });
    
    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/v1/users/999999')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(404);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should update a user', async () => {
      const updatedEmail = `updated-${Date.now()}@example.com`;
      
      const response = await request(app)
        .put(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: updatedEmail,
          role: 'manager'
        });
      
      expect(response.status).to.equal(200);
      expect(response.body.status).to.equal('success');
      expect(response.body.message).to.equal('User updated successfully');
      expect(response.body.data).to.have.property('email', updatedEmail);
      expect(response.body.data).to.have.property('role', 'manager');
      
      // Reset the email for subsequent tests
      await request(app)
        .put(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: testUser.email,
          role: testUser.role
        });
    });
    
    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'not-an-email',
          role: 'invalid-role'
        });
      
      expect(response.status).to.equal(400);
    });
  });

  // Note: We won't test DELETE here to avoid removing our test user
  describe('DELETE /api/v1/users/:id', () => {
    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/v1/users/999999')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(404);
    });
    
    // A mock test that doesn't actually delete for safety
    it('should successfully mock a user deletion', async () => {
      // Create a stub for the User repository's remove method
      const removeStub = sinon.stub().resolves();
      const findOneStub = sinon.stub().resolves({ id: '999', email: 'to-delete@example.com' });
      
      sinon.stub(AppDataSource, 'getRepository').returns({
        findOne: findOneStub,
        remove: removeStub
      } as any);
      
      const response = await request(app)
        .delete('/api/v1/users/999')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body.status).to.equal('success');
      expect(response.body.message).to.equal('User deleted successfully');
      
      // Restore the stub
      (AppDataSource.getRepository as sinon.SinonStub).restore();
    });
  });
});