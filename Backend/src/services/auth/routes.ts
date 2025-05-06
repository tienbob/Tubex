import { Router, RequestHandler } from 'express';
import passport from 'passport';
import { 
  register, 
  login, 
  refreshToken, 
  forgotPassword, 
  resetPassword, 
  verifyInvitationCode,
  generateInvitationCode 
} from './controller';
import { validateRegistration, validateLogin } from './validators';
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
  (async (req, res) => {
    if (!req.user) {
      return res.redirect(`${config.frontend.url}/auth/error`);
    }
    const tokens = generateTokens(req.user.id);
    res.redirect(`${config.frontend.url}/auth/callback?tokens=${JSON.stringify(tokens)}`);
  }) as RequestHandler
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
  (async (req, res) => {
    if (!req.user) {
      return res.redirect(`${config.frontend.url}/auth/error`);
    }
    const tokens = generateTokens(req.user.id);
    res.redirect(`${config.frontend.url}/auth/callback?tokens=${JSON.stringify(tokens)}`);
  }) as RequestHandler
);

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

export const authRoutes = router;