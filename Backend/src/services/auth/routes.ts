import { Router, RequestHandler } from 'express';
import passport from 'passport';
import { 
  register, 
  login, 
  refreshToken, 
  forgotPassword, 
  resetPassword, 
  verifyInvitationCode,
  generateInvitationCode,
  verifyEmail,
  verifyCompany,
  registerEmployee,
  completeOAuthRegistration,
  handleOAuthCallback,
  getPendingEmployees,
  sendInvitationEmailController,
  getInvitations
} from './controller';
import { schemas } from './validators';
import { authLimiter } from '../../middleware/rateLimiter';
import { authenticate, authorize, validate } from '../../middleware';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
    }
  }
}

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AuthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         data:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *             refreshToken:
 *               type: string
 *             user:
 *               $ref: '#/components/schemas/User'
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, manager, staff, dealer, supplier]
 *         companyId:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [active, inactive, pending]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user and company
 *     description: Create a new user account and associated company. Email verification required.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - companyName
 *               - companyType
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               companyType:
 *                 type: string
 *                 enum: [dealer, supplier]
 *               businessLicense:
 *                 type: string
 *               taxId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, manager, staff]
 *     responses:
 *       201:
 *         description: Registration successful, verification email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input or email already exists
 */
router.post('/register', authLimiter, validate({ body: schemas.registration }), register as RequestHandler);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user
 *     description: Login with email and password to receive access and refresh tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account not verified or company pending approval
 */
router.post('/login', authLimiter, validate({ body: schemas.login }), login as RequestHandler);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh-token', authLimiter, refreshToken as RequestHandler);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send password reset link to user's email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', authLimiter, forgotPassword as RequestHandler);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password', authLimiter, resetPassword as RequestHandler);

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Authenticate with Google
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Google login
 */
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google auth callback
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Authentication successful
 */
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  handleOAuthCallback as RequestHandler
);

/**
 * @swagger
 * /auth/facebook:
 *   get:
 *     summary: Authenticate with Facebook
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Facebook login
 */
router.get('/facebook',
  passport.authenticate('facebook', {
    scope: ['email'],
    session: false
  })
);

/**
 * @swagger
 * /auth/facebook/callback:
 *   get:
 *     summary: Facebook auth callback
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Authentication successful
 */
router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  handleOAuthCallback as RequestHandler
);

/**
 * @swagger
 * /auth/complete-oauth-registration:
 *   post:
 *     summary: Complete registration process for OAuth users
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tempUserId
 *               - company
 *             properties:
 *               tempUserId:
 *                 type: string
 *               company:
 *                 type: object
 *                 required:
 *                   - name
 *                   - type
 *                   - taxId
 *                   - businessLicense
 *                   - address
 *               userRole:
 *                 type: string
 *                 enum: [admin, manager, staff]
 *                 default: admin
 *     responses:
 *       201:
 *         description: Registration completed successfully
 */
router.post('/complete-oauth-registration', authLimiter, validate({ body: schemas.oauthRegistrationCompletion }), completeOAuthRegistration as RequestHandler);

/**
 * @swagger
 * /auth/invitation-code/{code}:
 *   get:
 *     summary: Verify invitation code and retrieve company information
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Invitation code to verify
 *     responses:
 *       200:
 *         description: Valid invitation code with company details
 *       404:
 *         description: Invalid invitation code or company not found
 */
router.get('/invitation-code/:code', verifyInvitationCode as RequestHandler);

/**
 * @swagger
 * /auth/invitation-code:
 *   post:
 *     summary: Generate a new invitation code for employee registration
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *             properties:
 *               companyId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Invitation code generated
 *       401:
 *         description: Authentication required
 */
router.post('/invitation-code', authenticate, authorize({ roles: ['admin', 'manager'] }), generateInvitationCode as RequestHandler);

/**
 * @swagger
 * /auth/verify-email/{token}:
 *   get:
 *     summary: Verify email address
 *     description: Verify user's email address using the token sent via email
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify-email/:token', verifyEmail as RequestHandler);

/**
 * @swagger
 * /auth/verify-company:
 *   post:
 *     summary: Verify a company registration (Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *               - status
 *             properties:
 *               companyId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [active, rejected]
 *               reason:
 *                 type: string
 *                 description: Required if status is rejected
 *     responses:
 *       200:
 *         description: Company verification successful
 *       400:
 *         description: Invalid input or company is not pending verification
 *       403:
 *         description: Not authorized to verify companies
 *       404:
 *         description: Company not found
 */
router.post('/verify-company', authenticate, authorize({ roles: ['admin'] }), verifyCompany as RequestHandler);

/**
 * @swagger
 * /auth/register-employee:
 *   post:
 *     summary: Register a new employee using invitation code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - invitationCode
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               invitationCode:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, manager, staff]
 *                 default: staff
 *     responses:
 *       201:
 *         description: Employee registration successful
 *       400:
 *         description: Invalid input or invitation code
 */
router.post('/register-employee', authLimiter, validate({ body: schemas.employeeRegistration }), registerEmployee as RequestHandler);

/**
 * @swagger
 * /auth/pending-employees:
 *   get:
 *     summary: Get pending employees for a company
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: The company ID to get pending employees for (optional, defaults to user's company)
 *     responses:
 *       200:
 *         description: List of pending employees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     employees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                           status:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: number
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to view these employees
 */
router.get('/pending-employees', authenticate, getPendingEmployees as RequestHandler);

/**
 * @swagger
 * /auth/send-invitation-email:
 *   post:
 *     summary: Send invitation email with code and role
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - code
 *               - role
 *               - companyId
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, manager, staff]
 *               message:
 *                 type: string
 *               companyId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitation email sent
 *       400:
 *         description: Invalid input or failed to send
 */
router.post('/send-invitation-email', authenticate, authorize({ roles: ['admin', 'manager'] }), sendInvitationEmailController as RequestHandler);

/**
 * @swagger
 * /auth/invitations:
 *   get:
 *     summary: List invitations for a company
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: The company ID to list invitations for (optional, defaults to user's company)
 *     responses:
 *       200:
 *         description: List of invitations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     invitations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                           status:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: number
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to view these invitations
 */
router.get('/invitations', authenticate, authorize({ roles: ['admin', 'manager'] }), getInvitations as RequestHandler);

export const authRoutes = router;