import { Router, RequestHandler } from 'express';
import { authenticate } from '../../middleware/auth';
import { isCompanyAdmin, canManageUser } from '../../middleware/adminAuth';
import { validateUserManagement } from './validators';
import {
    listCompanyUsers,
    updateUserRole,
    removeUser,
    getUserAuditLogs
} from './controller';
import { RequestHandlerWithAuth } from '../../types/express';

const router = Router();

// Convert authenticated handlers to regular request handlers
const wrap = (handler: RequestHandlerWithAuth): RequestHandler => 
    (req, res, next) => handler(req as any, res, next);

/**
 * @swagger
 * tags:
 *   name: User Management
 *   description: Company user management endpoints
 */

/**
 * @swagger
 * /company/manage:
 *   get:
 *     summary: List all users in the company
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Not authorized
 */
router.get('/', 
    authenticate,
    isCompanyAdmin,
    wrap(listCompanyUsers)
);

/**
 * @swagger
 * /company/manage/audit-logs:
 *   get:
 *     summary: Get user management audit logs
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *       403:
 *         description: Not authorized
 */
router.get('/audit-logs', 
    authenticate,
    isCompanyAdmin,
    wrap(getUserAuditLogs)
);

/**
 * @swagger
 * /company/manage/{userId}:
 *   put:
 *     summary: Update user role and status
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *               - status
 *               - reason
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, manager, staff]
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.put(
    '/:userId',
    authenticate,
    isCompanyAdmin,
    wrap(canManageUser),
    validateUserManagement,
    wrap(updateUserRole)
);

/**
 * @swagger
 * /company/manage/{userId}:
 *   delete:
 *     summary: Remove user from company (soft delete)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to remove
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User removed successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.delete(
    '/:userId',
    authenticate,
    isCompanyAdmin,
    wrap(canManageUser),
    validateUserManagement,
    wrap(removeUser)
);

export const userManagementRoutes = router;