import { Router } from 'express';
import { register, login, refreshToken, forgotPassword, resetPassword } from './controller';
import { validateRegistration, validateLogin } from './validators';

const router = Router();

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export const authRoutes = router;