import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AppError } from '../../middleware/errorHandler';
import { AppDataSource } from '../../database/ormconfig';
import { User, Company } from '../../database/models/sql';
import { redisClient } from '../../database';
import { config } from '../../config';
import { generateTokens } from './utils';
import { sendPasswordResetEmail, sendWelcomeEmail, sendVerificationEmail, sendLoginNotificationEmail, sendCompanyApprovalNotification, sendCompanyRejectionNotification } from '../email/service';
import { invitationEmailSchema } from './invitationEmailSchema';
import { sendInvitationEmail as sendInvitationEmailUtil } from '../email/invitation';
import { Invitation } from '../../database/models/sql/invitation';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);
    const companyRepository = AppDataSource.getRepository(Company);

    try {
        const { email, password, company, firstName, lastName, userRole = 'admin' } = req.body;

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
        // newCompany.employee_count = company.employeeCount || 0; // Removed field
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
        
        // Add first name and last name to user metadata
        user.metadata = {
            firstName: firstName || '',
            lastName: lastName || ''
        };
        
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
    try {
        // Verify that database is initialized
        if (!AppDataSource.isInitialized) {
            console.error('Database connection not initialized');
            throw new AppError(500, 'Database connection error. Please try again later.');
        }
        
        const userRepository = AppDataSource.getRepository(User);
        console.log('User repository initialized successfully');
        
        const { email, password, rememberMe = false } = req.body;
        console.log(`Login attempt for email: ${email}`);

        // Find user
        const user = await userRepository.findOne({
            where: { email },
            relations: ['company']
        });

        if (!user) {
            console.log(`User not found: ${email}`);
            throw new AppError(401, 'Invalid credentials');
        }

        console.log(`User found: ${user.id}, status: ${user.status}, role: ${user.role}`);

        // Track failed login attempts
        const failedLoginKey = `failed_login:${email}`;
        const failedAttempts = await redisClient.get(failedLoginKey);
        const maxFailedAttempts = 5;
        
        if (failedAttempts && parseInt(failedAttempts) >= maxFailedAttempts) {
            const lockoutTime = await redisClient.ttl(failedLoginKey);
            
            if (lockoutTime > 0) {
                throw new AppError(429, `Too many failed login attempts. Please try again in ${Math.ceil(lockoutTime / 60)} minutes.`);
            }
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            console.log('Password validation failed');
            
            // Increment failed login attempts
            const currentAttempts = failedAttempts ? parseInt(failedAttempts) + 1 : 1;
            
            // Set lockout time if maximum attempts reached
            if (currentAttempts >= maxFailedAttempts) {
                // Lockout for 15 minutes
                await redisClient.set(failedLoginKey, currentAttempts.toString(), {
                    EX: 15 * 60 // 15 minutes
                });
            } else {
                // Store attempt count, expire in 1 hour
                await redisClient.set(failedLoginKey, currentAttempts.toString(), {
                    EX: 60 * 60 // 1 hour
                });
            }
            
            throw new AppError(401, 'Invalid credentials');
        }

        // Reset failed login attempts on successful login
        await redisClient.del(failedLoginKey);

        // Check if user is active
        if (user.status !== 'active') {
            console.log(`User not active: ${user.status}`);
            // Provide more specific message based on status
            if (user.status === 'pending') {
                throw new AppError(401, 'Your email address has not been verified. Please check your email for a verification link.');
            } else if (user.status === 'suspended') {
                throw new AppError(401, 'Your account has been suspended. Please contact support for assistance.');
            } else if (user.status === 'locked') {
                throw new AppError(401, 'Your account has been locked due to suspicious activity. Please reset your password to unlock it.');
            } else {
                throw new AppError(401, 'Your account is not active. Please contact support for assistance.');
            }
        }

        // Check if company is active (only for non-admin users)
        if (user.company && user.role !== 'admin') {
            if (user.company.status !== 'active') {
                console.log(`Company not active: ${user.company.status}`);
                
                if (user.company.status === 'pending_verification') {
                    throw new AppError(401, 'Your company is pending verification. You will be notified when verification is complete.');
                } else if (user.company.status === 'rejected') {
                    throw new AppError(401, 'Your company registration has been rejected. Please contact support for more information.');
                } else if (user.company.status === 'suspended') {
                    throw new AppError(401, 'Your company account has been suspended. Please contact support for assistance.');
                } else {
                    throw new AppError(401, 'Your company account is not active. Please contact support for assistance.');
                }
            }
        }        // Generate tokens with rememberMe option
        const { accessToken, refreshToken } = generateTokens(user.id, rememberMe);

        // Store user preference for rememberMe
        const userPreferenceKey = `user_prefs:${user.id}`;
        await redisClient.set(userPreferenceKey, JSON.stringify({ rememberMe }), {
            EX: 30 * 24 * 60 * 60 // 30 days
        });

        // Store refresh token in Redis with longer expiry if "Remember me" is selected
        const refreshTokenExpiry = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days for "Remember me", 7 days default
        
        await redisClient.set(`refresh_token:${user.id}`, refreshToken, {
            EX: refreshTokenExpiry
        });

        // Get device and location information for security notification
        const userAgent = req.headers['user-agent'] || 'unknown';
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        
        // Create a device identifier from IP and user agent
        const deviceId = require('crypto')
            .createHash('md5')
            .update(`${ipAddress}-${userAgent}`)
            .digest('hex');

        const deviceKey = `login_device:${user.id}:${deviceId}`;
        const knownDevice = await redisClient.get(deviceKey);
        
        if (!knownDevice) {
            try {
                // Send notification about login from new device
                await sendLoginNotificationEmail(
                    user.email, 
                    new Date(),
                    {
                        ipAddress,
                        userAgent,
                        timestamp: new Date().toISOString()
                    }
                );
                
                // Store this device as known for future logins
                await redisClient.set(deviceKey, new Date().toISOString(), {
                    EX: 90 * 24 * 60 * 60 // 90 days
                });
            } catch (emailError) {
                // Log but don't fail the login if email notification fails
                console.error('Failed to send login notification email:', emailError);
            }
        }

        // Record successful login
        await redisClient.set(`last_login:${user.id}`, JSON.stringify({
            timestamp: new Date().toISOString(),
            ipAddress,
            userAgent,
            deviceId
        }), {
            EX: 90 * 24 * 60 * 60 // 90 days retention
        });        console.log(`Login successful for user: ${user.id}`);
        
        // Ensure companyId is available
        const companyId = user.company?.id || user.company_id;
        if (!companyId) {
            console.error('User has no company assigned:', {
                userId: user.id,
                email: user.email,
                company: user.company,
                company_id: user.company_id
            });
            throw new AppError(500, 'User account is not properly configured. Please contact support.');
        }
        
        // Return a response that includes all the fields the frontend expects
        res.status(200).json({
            status: 'success',
            data: {
                userId: user.id,
                companyId: companyId,
                email: user.email,
                role: user.role,
                status: user.status,
                firstName: user.metadata?.firstName || '',
                lastName: user.metadata?.lastName || '',
                accessToken,
                refreshToken,
                rememberMe
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        next(error);
    }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken, rememberMe } = req.body;

        if (!refreshToken) {
            throw new AppError(400, 'Refresh token is required');
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, config.jwt.secret as jwt.Secret) as { id: string };        // Check if refresh token exists in Redis
        const storedToken = await redisClient.get(`refresh_token:${decoded.id}`);
        if (!storedToken || storedToken !== refreshToken) {
            throw new AppError(401, 'Invalid refresh token');
        }

        // Use the same "Remember me" preference that was set during login
        // or use the current request's value if explicitly provided
        const userPreferenceKey = `user_prefs:${decoded.id}`;
        let shouldRemember = rememberMe;
        
        // If rememberMe wasn't provided in the request, try to get from stored preferences
        if (shouldRemember === undefined) {
            const userPrefs = await redisClient.get(userPreferenceKey);
            if (userPrefs) {
                try {
                    const parsedPrefs = JSON.parse(userPrefs);
                    shouldRemember = parsedPrefs.rememberMe || false;
                } catch (e) {
                    shouldRemember = false;
                }
            }
        }

        // Generate new tokens with rememberMe preference
        const tokens = generateTokens(decoded.id, shouldRemember);
        
        // If rememberMe wasn't provided in the request, try to get from stored preferences
        if (shouldRemember === undefined) {
            const userPrefs = await redisClient.get(userPreferenceKey);
            if (userPrefs) {
                try {
                    const parsedPrefs = JSON.parse(userPrefs);
                    shouldRemember = parsedPrefs.rememberMe || false;
                } catch (e) {
                    shouldRemember = false;
                }
            }
        }
        
        // Store the preference for future token refreshes
        await redisClient.set(userPreferenceKey, JSON.stringify({ rememberMe: shouldRemember }), {
            EX: 30 * 24 * 60 * 60 // 30 days
        });
        
        // Set appropriate expiry time based on "Remember me" preference
        const refreshTokenExpiry = shouldRemember ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days vs 7 days

        // Update refresh token in Redis
        await redisClient.set(`refresh_token:${decoded.id}`, tokens.refreshToken, {
            EX: refreshTokenExpiry
        });

        res.status(200).json({
            status: 'success',
            data: {
                ...tokens,
                rememberMe: shouldRemember
            }
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

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);
    
    try {
        const { token } = req.params;
        
        if (!token) {
            throw new AppError(400, 'Verification token is missing');
        }
        
        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret as jwt.Secret) as { id: string };
        
        // Check if verification token exists in Redis
        const storedToken = await redisClient.get(`email_verification:${decoded.id}`);
        if (!storedToken || storedToken !== token) {
            throw new AppError(401, 'Invalid or expired verification token');
        }
        
        // Find user
        const user = await userRepository.findOne({ 
            where: { id: decoded.id },
            relations: ['company']
        });
        
        if (!user) {
            throw new AppError(404, 'User not found');
        }
        
        // Mark user as verified
        if (user.status === 'pending') {
            user.status = 'active';
            await userRepository.save(user);
            
            // Remove verification token from Redis
            await redisClient.del(`email_verification:${decoded.id}`);
            
            return res.status(200).json({
                status: 'success',
                message: 'Email verified successfully. You can now log in to your account.',
                redirectUrl: `${config.frontend.url}/auth/login`
            });
        }
        
        // If user is already active
        return res.status(200).json({
            status: 'success',
            message: 'Email already verified. You can log in to your account.',
            redirectUrl: `${config.frontend.url}/auth/login`
        });
        
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid or expired verification token',
                redirectUrl: `${config.frontend.url}/auth/verification-failed`
            });
        }
        next(error);
    }
};

export const verifyCompany = async (req: Request, res: Response, next: NextFunction) => {
    const companyRepository = AppDataSource.getRepository(Company);
    const userRepository = AppDataSource.getRepository(User);

    try {
        // Check if the current user has admin privileges
        if (!req.user || req.user.role !== 'admin') {
            throw new AppError(403, 'Only administrators can verify companies');
        }

        const { companyId, status, reason } = req.body;

        if (!['active', 'rejected'].includes(status)) {
            throw new AppError(400, 'Invalid status value - must be "active" or "rejected"');
        }

        // Find the company
        const company = await companyRepository.findOne({ 
            where: { id: companyId } 
        });

        if (!company) {
            throw new AppError(404, 'Company not found');
        }

        if (company.status !== 'pending_verification') {
            throw new AppError(400, 'Company is not pending verification');
        }

        // Update company status
        company.status = status;
        await companyRepository.save(company);

        // If approved, activate all pending users for this company
        if (status === 'active') {
            // Find company admin user
            const adminUser = await userRepository.findOne({
                where: { 
                    company_id: companyId,
                    role: 'admin',
                    status: 'active' // Only notify users with verified emails
                }
            });

            if (adminUser) {
                // Send company approval notification
                try {
                    await sendCompanyApprovalNotification(adminUser.email, company.name);
                } catch (error) {
                    console.error('Failed to send company approval notification:', error);
                    // Continue execution even if notification fails
                }
            }
        } else if (status === 'rejected' && reason) {
            // Find company admin to notify about rejection
            const adminUser = await userRepository.findOne({
                where: { 
                    company_id: companyId,
                    role: 'admin'
                }
            });

            if (adminUser) {
                // Send company rejection notification
                try {
                    await sendCompanyRejectionNotification(adminUser.email, company.name, reason);
                } catch (error) {
                    console.error('Failed to send company rejection notification:', error);
                    // Continue execution even if notification fails
                }
            }
        }

        res.status(200).json({
            status: 'success',
            message: status === 'active' 
                ? 'Company successfully verified and activated' 
                : 'Company registration rejected',
            data: {
                companyId: company.id,
                companyName: company.name,
                status: company.status
            }
        });

    } catch (error) {
        next(error);
    }
};

export const registerEmployee = async (req: Request, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);
    const companyRepository = AppDataSource.getRepository(Company);
    const invitationRepository = AppDataSource.getRepository(Invitation);

    try {
        const { email, password, firstName, lastName, invitationCode, role = 'staff' } = req.body;

        // Validate role
        if (!['admin', 'manager', 'staff'].includes(role)) {
            throw new AppError(400, 'Invalid role. Must be one of: admin, manager, staff');
        }

        // Find invitation by code and status
        const invitation = await invitationRepository.findOne({ where: { code: invitationCode, status: 'pending' } });
        if (!invitation) {
            throw new AppError(400, 'Invalid or expired invitation code');
        }

        // Check if user already exists
        const existingUser = await userRepository.findOne({ where: { email: invitation.email } });
        if (existingUser) {
            throw new AppError(400, 'User with this email already exists');
        }

        // Find company
        const company = await companyRepository.findOne({ where: { id: invitation.company_id || invitation.company?.id } });
        if (!company) {
            throw new AppError(404, 'Company not found');
        }

        // Check company status
        if (company.status !== 'active') {
            throw new AppError(400, 'Cannot join this company. The company account is not active.');
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user using invitation data
        const user = new User();
        user.email = invitation.email;
        user.password_hash = passwordHash;
        user.role = invitation.role as 'admin' | 'manager' | 'staff';
        user.company = company;
        user.company_id = company.id;
        user.status = 'active'; // Set to active on registration
        user.metadata = {
            firstName: firstName || '',
            lastName: lastName || '',
            invitedAt: invitation.created_at ? invitation.created_at.toISOString?.() : new Date().toISOString()
        };
        await userRepository.save(user);

        // Increment company's employee_count
        company.employee_count = (company.employee_count || 0) + 1;
        await companyRepository.save(company);

        // Mark invitation as accepted/used
        invitation.status = 'accepted';
        invitation.updated_at = new Date();
        await invitationRepository.save(invitation);

        res.status(201).json({
            status: 'success',
            data: {
                userId: user.id,
                companyId: company.id,
                companyName: company.name,
                message: 'Registration successful. Your account is now active.'
            }
        });
    } catch (error) {
        next(error);
    }
};

export const completeOAuthRegistration = async (req: Request, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);
    const companyRepository = AppDataSource.getRepository(Company);

    try {
        const { tempUserId, company, userRole = 'admin' } = req.body;

        if (!tempUserId) {
            throw new AppError(400, 'Missing temporary user ID');
        }

        // Retrieve the OAuth profile data from Redis
        const profileData = await redisClient.get(`oauth_profile:${tempUserId}`);
        if (!profileData) {
            throw new AppError(400, 'Registration session expired or invalid');
        }

        const profile = JSON.parse(profileData);
        const email = profile.emails?.[0]?.value;

        if (!email) {
            throw new AppError(400, 'Email address is required');
        }

        // Check if user already exists (shouldn't happen but double-checking)
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new AppError(400, 'User with this email already exists');
        }

        // Check for duplicate company tax ID
        if (company?.taxId) {
            const existingCompany = await companyRepository.findOne({ 
                where: { tax_id: company.taxId }
            });
            if (existingCompany) {
                throw new AppError(400, 'A company with this tax ID is already registered');
            }
        }

        // Create company with enhanced details
        const newCompany = new Company();
        newCompany.name = company.name;
        newCompany.type = company.type;
        newCompany.tax_id = company.taxId;
        newCompany.business_license = company.businessLicense;
        newCompany.address = company.address;
        newCompany.business_category = company.businessCategory || '';
        // newCompany.employee_count = company.employeeCount || 0; // Removed field
        newCompany.year_established = company.yearEstablished || new Date().getFullYear();
        newCompany.contact_phone = company.contactPhone;
        newCompany.status = 'pending_verification'; // New companies need verification
        newCompany.subscription_tier = 'free';
        
        await companyRepository.save(newCompany);

        // Create user
        const user = new User();
        user.email = email;
        user.password_hash = ''; // OAuth users don't have passwords
        user.role = userRole;
        user.company = newCompany;
        user.company_id = newCompany.id;
        user.status = 'active'; // OAuth users are automatically verified

        // Add profile data to user metadata
        const firstName = profile.firstName || '';
        const lastName = profile.lastName || '';
        
        user.metadata = {
            firstName,
            lastName,
            oauthProvider: profile.provider,
            [`${profile.provider}Id`]: profile.id,
            profilePictureUrl: profile.photos?.[0]?.value || null,
            profileComplete: true,
            registeredAt: new Date().toISOString()
        };
        
        await userRepository.save(user);        // Generate tokens for automatic login (default to short expiry for security)
        const { accessToken, refreshToken } = generateTokens(user.id, false);

        // Store refresh token in Redis
        await redisClient.set(`refresh_token:${user.id}`, refreshToken, {
            EX: 7 * 24 * 60 * 60 // 7 days
        });

        // Remove the temporary profile data
        await redisClient.del(`oauth_profile:${tempUserId}`);

        // Send welcome email
        await sendWelcomeEmail(user.email, company.name);

        // Notify admin about new company registration
        // TODO: Implement admin notification service

        res.status(201).json({
            status: 'success',
            data: {
                userId: user.id,
                companyId: newCompany.id,
                email: user.email,
                role: user.role,
                status: user.status,
                firstName: user.metadata?.firstName || '',
                lastName: user.metadata?.lastName || '',
                accessToken,
                refreshToken,
                message: 'Registration successful. Your company registration is pending verification by our team.'
            }
        });
    } catch (error) {
        next(error);
    }
};

export const handleOAuthCallback = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.redirect(`${config.frontend.url}/auth/error`);
    }

    const user = req.user as any;

    // Check if the user needs to complete registration
    if (user.needsRegistration) {
        // Redirect to the registration completion page
        return res.redirect(
            `${config.frontend.url}/auth/complete-registration?` +
            `tempUserId=${user.tempUserId}&` +
            `email=${encodeURIComponent(user.email)}&` +
            `provider=${user.provider}`
        );
    }    // Regular OAuth login - generate tokens (default to short expiry for security)
    const { accessToken, refreshToken } = generateTokens(user.id, false);

    // Store refresh token in Redis
    await redisClient.set(`refresh_token:${user.id}`, refreshToken, {
        EX: 7 * 24 * 60 * 60 // 7 days
    });

    // Redirect to the callback URL with tokens
    res.redirect(
        `${config.frontend.url}/auth/callback?` +
        `tokens=${encodeURIComponent(JSON.stringify({ accessToken, refreshToken }))}&` +
        `userId=${user.id}&` +
        `email=${encodeURIComponent(user.email)}`
    );
};

/**
 * Get pending employees for a company
 * This endpoint returns employees who have registered but not verified their email
 */
export const getPendingEmployees = async (req: Request, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);
    
    try {
        // Check if the user is authenticated and has appropriate permissions
        if (!req.user) {
            throw new AppError(401, 'Authentication required');
        }
        
        // Get company ID (either from query param or from authenticated user)
        const companyId = req.query.companyId || req.user.companyId;
        
        if (!companyId) {
            throw new AppError(400, 'Company ID is required');
        }
        
        // Check if the user has permission to view this company's employees
        if (req.user.role !== 'admin' && req.user.companyId !== companyId) {
            throw new AppError(403, 'You do not have permission to view employees from this company');
        }
        
        // Query for pending employees
        const pendingEmployees = await userRepository.find({
            where: {
                company_id: companyId as string,
                status: 'pending'
            },
            select: ['id', 'email', 'role', 'status', 'created_at', 'metadata'],
            order: {
                created_at: 'DESC'
            }
        });
        
        // Format the response data
        const formattedEmployees = pendingEmployees.map(employee => ({
            id: employee.id,
            email: employee.email,
            role: employee.role,
            status: employee.status,
            firstName: employee.metadata?.firstName || '',
            lastName: employee.metadata?.lastName || '',
            createdAt: employee.created_at
        }));
        
        res.status(200).json({
            status: 'success',
            data: {
                employees: formattedEmployees,
                count: formattedEmployees.length
            }
        });
    } catch (error) {
        next(error);
    }
};

export const sendInvitationEmailController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { to, code, role, message, companyId } = req.body;
        await invitationEmailSchema.validateAsync({ to, code, role, message, companyId });

        // Save invitation to DB
        const invitationRepository = AppDataSource.getRepository(Invitation);
        await invitationRepository.save({
            email: to,
            code,
            role,
            company_id: companyId,
            message,
            status: 'pending'
        });

        await sendInvitationEmailUtil(to, code, role, message, companyId);
        res.status(200).json({ status: 'success', message: 'Invitation email sent.' });
    } catch (error) {
        next(new AppError(400, error instanceof Error ? error.message : 'Failed to send invitation email'));
    }
};

export const getInvitations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let companyId = req.query.companyId || req.user?.companyId;
        if (!companyId) {
            throw new AppError(400, 'Company ID is required');
        }
        // Ensure companyId is a string
        if (Array.isArray(companyId)) {
            companyId = companyId[0];
        } else if (typeof companyId === 'object' && companyId !== null) {
            companyId = companyId.toString();
        }
        const invitationRepository = AppDataSource.getRepository(Invitation);
        const invitations = await invitationRepository.find({
            where: { company_id: companyId as string },
            order: { created_at: 'DESC' }
        });
        res.json({ status: 'success', data: { invitations } });
    } catch (err) {
        next(err);
    }
};
