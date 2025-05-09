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
  handleOAuthCallback
} from './controller';
import { 
  validateRegistration, 
  validateLogin, 
  validateEmployeeRegistration,
  validateOAuthRegistrationCompletion
} from './validators';
import { authLimiter } from '../../middleware/rateLimiter';
import { authenticate, authorize } from '../../middleware/auth';
import { generateTokens } from './utils';
import { config } from '../../config';
import { User } from '../../database/models/sql';

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
 * /auth/register:
 *   post:
 *     summary: Register a new user and company
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
 *               - companyName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               companyName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [dealer, supplier, admin]
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', authLimiter, validateRegistration, register as RequestHandler);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
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
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', authLimiter, validateLogin, login as RequestHandler);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
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
 *         description: Token refresh successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post('/refresh-token', authLimiter, refreshToken as RequestHandler);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
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
router.post('/complete-oauth-registration', authLimiter, validateOAuthRegistrationCompletion, completeOAuthRegistration as RequestHandler);

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
router.post('/invitation-code', authenticate, authorize('admin', 'manager'), generateInvitationCode as RequestHandler);

/**
 * @swagger
 * /auth/verify-email/{token}:
 *   get:
 *     summary: Verify email with token
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Email verification token sent to user's email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       401:
 *         description: Invalid or expired verification token
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
router.post('/verify-company', authenticate, authorize('admin'), verifyCompany as RequestHandler);

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
router.post('/register-employee', authLimiter, validateEmployeeRegistration, registerEmployee as RequestHandler);

export const authRoutes = router;