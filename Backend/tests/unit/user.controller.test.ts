import { expect } from 'chai';
import * as chai from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import { Request, Response } from 'express';
import { AppError } from '../../src/middleware/errorHandler';
import { AppDataSource } from '../../src/database/ormconfig';
import { User } from '../../src/database/models/sql';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../../src/services/user/controller';

// Setup Chai to use Sinon-Chai plugin
chai.use(sinonChai);

// Add Mocha global function declarations
declare const describe: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const it: any;

describe('User Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: sinon.SinonSpy;
  let userRepositoryStub: sinon.SinonStub;
  let userFindOneStub: sinon.SinonStub;
  let userFindAndCountStub: sinon.SinonStub;
  let userSaveStub: sinon.SinonStub;
  let userRemoveStub: sinon.SinonStub;

  beforeEach(() => {
    // Common setup for request, response and next function
    req = {};
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    next = sinon.spy();

    // Create stubs for repository methods
    userFindAndCountStub = sinon.stub();
    userFindOneStub = sinon.stub();
    userSaveStub = sinon.stub();
    userRemoveStub = sinon.stub();

    // Stub the AppDataSource.getRepository to return our mocked repository
    userRepositoryStub = sinon.stub(AppDataSource, 'getRepository').returns({
      findAndCount: userFindAndCountStub,
      findOne: userFindOneStub,
      save: userSaveStub,
      remove: userRemoveStub
    } as any);
  });

  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });

  describe('getAllUsers', () => {
    it('should return a list of users with pagination', async () => {
      // Arrange
      req.query = { page: '1', limit: '10' };
      const mockUsers = [
        { id: '1', email: 'user1@example.com' },
        { id: '2', email: 'user2@example.com' }
      ];
      const total = 2;
      userFindAndCountStub.resolves([mockUsers, total]);

      // Act
      await getAllUsers(req as Request, res as Response, next);

      // Assert
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith({
        status: 'success',
        data: {
          users: mockUsers,
          pagination: {
            total,
            page: 1,
            limit: 10,
            pages: 1
          }
        }
      });
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      userFindAndCountStub.rejects(error);

      // Act
      await getAllUsers(req as Request, res as Response, next);

      // Assert
      expect(next).to.have.been.calledWith(error);
    });
  });

  describe('getUserById', () => {
    it('should return a user by ID', async () => {
      // Arrange
      const mockUser = { id: '123', email: 'user@example.com' };
      req.params = { id: '123' };
      userFindOneStub.resolves(mockUser);

      // Act
      await getUserById(req as Request, res as Response, next);

      // Assert
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith({
        status: 'success',
        data: { user: mockUser }
      });
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      req.params = { id: '123' };
      userFindOneStub.resolves(null);

      // Act
      await getUserById(req as Request, res as Response, next);

      // Assert
      expect(next).to.have.been.calledWith(sinon.match.instanceOf(AppError));
      expect(next.firstCall.args[0].statusCode).to.equal(404);
      expect(next.firstCall.args[0].message).to.equal('User not found');
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      // Arrange
      const mockUser = { 
        id: '123', 
        email: 'old@example.com', 
        role: 'staff', 
        status: 'active',
        updated_at: new Date()
      };
      req.params = { id: '123' };
      req.body = { email: 'new@example.com', role: 'manager' };
      userFindOneStub.resolves(mockUser);
      userSaveStub.resolves({
        ...mockUser,
        email: 'new@example.com',
        role: 'manager'
      });

      // Act
      await updateUser(req as Request, res as Response, next);

      // Assert
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith({
        status: 'success',
        message: 'User updated successfully',
        data: sinon.match({
          id: '123',
          email: 'new@example.com',
          role: 'manager'
        })
      });
    });

    it('should return 404 if user to update is not found', async () => {
      // Arrange
      req.params = { id: '123' };
      req.body = { email: 'new@example.com' };
      userFindOneStub.resolves(null);

      // Act
      await updateUser(req as Request, res as Response, next);

      // Assert
      expect(next).to.have.been.calledWith(sinon.match.instanceOf(AppError));
      expect(next.firstCall.args[0].statusCode).to.equal(404);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      // Arrange
      const mockUser = { id: '123', email: 'user@example.com' };
      req.params = { id: '123' };
      userFindOneStub.resolves(mockUser);
      userRemoveStub.resolves();

      // Act
      await deleteUser(req as Request, res as Response, next);

      // Assert
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith({
        status: 'success',
        message: 'User deleted successfully'
      });
    });

    it('should return 404 if user to delete is not found', async () => {
      // Arrange
      req.params = { id: '123' };
      userFindOneStub.resolves(null);

      // Act
      await deleteUser(req as Request, res as Response, next);

      // Assert
      expect(next).to.have.been.calledWith(sinon.match.instanceOf(AppError));
      expect(next.firstCall.args[0].statusCode).to.equal(404);
    });
  });
});