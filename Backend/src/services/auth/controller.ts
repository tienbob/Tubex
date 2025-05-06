import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AppError } from '../../middleware/errorHandler';
import { AppDataSource } from '../../database/ormconfig';
import { User, Company } from '../../database/models/sql';
import { redisClient } from '../../database';
import { config } from '../../config';
import { generateTokens } from './utils';
import { sendPasswordResetEmail, sendWelcomeEmail, sendVerificationEmail, sendLoginNotificationEmail } from '../email/service';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);
    const companyRepository = AppDataSource.getRepository(Company);

    try {
        const { email, password, company, userRole = 'admin' } = req.body;

        // Check if user already exists
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new AppError(400, 'User with this email already exists');
        }

        // Check for duplicate company tax ID
        const existingCompany = await companyRepository.findOne({ 
            where: { tax_id: company.taxId }
        });
        if (existingCompany) {
            throw new AppError(400, 'A company with this tax ID is already registered');
        }

        // Create company with enhanced details
        const newCompany = new Company();
        newCompany.name = company.name;
        newCompany.type = company.type;
        newCompany.tax_id = company.taxId;
        newCompany.business_license = company.businessLicense;
        newCompany.address = company.address;
        newCompany.business_category = company.businessCategory || '';
        newCompany.employee_count = company.employeeCount || 0;
        newCompany.year_established = company.yearEstablished || new Date().getFullYear();
        newCompany.contact_phone = company.contactPhone;
        newCompany.status = 'pending_verification'; // New companies need verification
        newCompany.subscription_tier = 'free';
        
        await companyRepository.save(newCompany);

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const user = new User();
        user.email = email;
        user.password_hash = passwordHash;
        user.role = userRole;
        user.company = newCompany;
        user.status = 'pending'; // User status starts as pending until email is verified
        await userRepository.save(user);

        // Generate verification tokens
        const emailVerificationToken = jwt.sign(
            { id: user.id },
            config.jwt.secret as jwt.Secret,
            { expiresIn: '24h' }
        );

        const companyVerificationToken = jwt.sign(
            { 
                companyId: newCompany.id,
                taxId: company.taxId,
                businessLicense: company.businessLicense
            },
            config.jwt.secret as jwt.Secret,
            { expiresIn: '72h' }
        );

        // Store verification tokens in Redis
        await Promise.all([
            redisClient.set(`email_verification:${user.id}`, emailVerificationToken, {
                EX: 24 * 60 * 60 // 24 hours
            }),
            redisClient.set(`company_verification:${newCompany.id}`, companyVerificationToken, {
                EX: 72 * 60 * 60 // 72 hours
            })
        ]);

        // Send welcome and verification emails
        await Promise.all([
            sendWelcomeEmail(user.email, company.name),
            sendVerificationEmail(user.email, emailVerificationToken)
        ]);

        // Notify admin about new company registration
        // TODO: Implement admin notification service

        res.status(201).json({
            status: 'success',
            data: {
                userId: user.id,
                companyId: newCompany.id,
                message: 'Registration successful. Please check your email to verify your account. Your company registration is pending verification by our team.'
            }
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);

    try {
        const { email, password } = req.body;

        // Find user
        const user = await userRepository.findOne({
            where: { email },
            relations: ['company']
        });

        if (!user) {
            throw new AppError(401, 'Invalid credentials');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new AppError(401, 'Invalid credentials');
        }

        // Check if user is active
        if (user.status !== 'active') {
            throw new AppError(401, 'Account is not active');
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id);

        // Store refresh token in Redis
        await redisClient.set(`refresh_token:${user.id}`, refreshToken, {
            EX: 7 * 24 * 60 * 60 // 7 days
        });

        // Get IP location for security notification
        const ipAddress = req.ip || req.socket.remoteAddress;
        const lastLoginKey = `last_login_ip:${user.id}`;
        const lastLoginIp = await redisClient.get(lastLoginKey); 

        // If IP is different from last login, send notification
        if (lastLoginIp !== ipAddress) {
            await sendLoginNotificationEmail(user.email, new Date());
            // Update last login IP
            await redisClient.set(lastLoginKey, ipAddress || 'unknown', {
                EX: 7 * 24 * 60 * 60 // 7 days
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                userId: user.id,
                companyId: user.company.id,
                role: user.role,
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new AppError(400, 'Refresh token is required');
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, config.jwt.secret as jwt.Secret) as { id: string };

        // Check if refresh token exists in Redis
        const storedToken = await redisClient.get(`refresh_token:${decoded.id}`);
        if (!storedToken || storedToken !== refreshToken) {
            throw new AppError(401, 'Invalid refresh token');
        }

        // Generate new tokens
        const tokens = generateTokens(decoded.id);

        // Update refresh token in Redis
        await redisClient.set(`refresh_token:${decoded.id}`, tokens.refreshToken, {
            EX: 7 * 24 * 60 * 60 // 7 days
        });

        res.status(200).json({
            status: 'success',
            data: tokens
        });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new AppError(401, 'Invalid refresh token'));
        } else {
            next(error);
        }
    }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);

    try {
        const { email } = req.body;

        // Check if user exists
        const user = await userRepository.findOne({ where: { email } });
        if (!user) {
            // Return success even if user doesn't exist for security
            return res.status(200).json({
                status: 'success',
                message: 'If your email is registered, you will receive password reset instructions'
            });
        }

        // Generate password reset token
        const resetToken = jwt.sign(
            { id: user.id },
            config.jwt.secret as jwt.Secret,
            { expiresIn: '1h' }
        );

        // Store token in Redis with expiry
        await redisClient.set(`pwd_reset:${user.id}`, resetToken, {
            EX: 60 * 60 // 1 hour
        });

        // Send password reset email
        await sendPasswordResetEmail(user.email, resetToken);

        res.status(200).json({
            status: 'success',
            message: 'Password reset instructions sent to email'
        });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);

    try {
        const { token, newPassword } = req.body;

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret as jwt.Secret) as { id: string };

        // Check if reset token exists in Redis
        const storedToken = await redisClient.get(`pwd_reset:${decoded.id}`);
        if (!storedToken || storedToken !== token) {
            throw new AppError(401, 'Invalid or expired reset token');
        }

        // Find user
        const user = await userRepository.findOne({ where: { id: decoded.id } });
        if (!user) {
            throw new AppError(404, 'User not found');
        }

        // Hash new password
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password_hash = passwordHash;
        await userRepository.save(user);

        // Remove reset token from Redis
        await redisClient.del(`pwd_reset:${decoded.id}`);

        res.status(200).json({
            status: 'success',
            message: 'Password successfully reset'
        });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new AppError(401, 'Invalid or expired reset token'));
        } else {
            next(error);
        }
    }
};

export const verifyInvitationCode = async (req: Request, res: Response, next: NextFunction) => {
    const companyRepository = AppDataSource.getRepository(Company);
    
    try {
        const { code } = req.params;
        
        if (!code || code.length < 5) {
            throw new AppError(400, 'Invalid invitation code format');
        }
        
        // In a real implementation, the invitation codes would be stored in the database
        // Here we would query for invitation codes linked to companies
        // For now, we're using Redis to store and retrieve invitation-company mappings
        
        const companyId = await redisClient.get(`invitation_code:${code}`);
        
        if (!companyId) {
            throw new AppError(404, 'Invalid invitation code');
        }
        
        const company = await companyRepository.findOne({ where: { id: companyId } });
        
        if (!company) {
            throw new AppError(404, 'Company not found');
        }
        
        if (company.status !== 'active' && company.status !== 'pending_verification') {
            throw new AppError(400, 'Company is not active');
        }
        
        // Return company info without sensitive data
        res.status(200).json({
            status: 'success',
            data: {
                id: company.id,
                name: company.name,
                type: company.type,
                business_category: company.business_category
            }
        });
        
    } catch (error) {
        next(error);
    }
};

// For demo/testing purposes, let's create a utility method to generate invitation codes
export const generateInvitationCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError(401, 'Authentication required');
        
        const { companyId } = req.body;
        
        // Generate a random code (in production, use a more secure method)
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Store the invitation code with company ID in Redis
        // Set expiry to 7 days
        await redisClient.set(`invitation_code:${code}`, companyId, {
            EX: 7 * 24 * 60 * 60
        });
        
        res.status(201).json({
            status: 'success',
            data: {
                code,
                expiresIn: '7 days'
            }
        });
        
    } catch (error) {
        next(error);
    }
};