import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from './controller';
import { validateUserUpdate } from './validators';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User management routes
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', validateUserUpdate, updateUser);
router.delete('/:id', deleteUser);

export const userRoutes = router;