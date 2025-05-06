import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../database/ormconfig';
import { User } from '../../database/models/sql/user';
import { UserAuditLog } from '../../database/models/sql/userAudit';
import { AppError } from '../../middleware/errorHandler';
import { sendUserStatusChangeEmail } from '../email/service';
import { AuthenticatedRequest } from '../../types/express';

export const listCompanyUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userRepository = AppDataSource.getRepository(User);
        
        const users = await userRepository.find({
            where: { company: { id: req.user.companyId } },
            select: ['id', 'email', 'role', 'status', 'created_at', 'updated_at']
        });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);
    const auditRepository = AppDataSource.getRepository(UserAuditLog);

    try {
        const { role, status, reason } = req.body;
        const targetUserId = req.params.userId;

        // Find target user
        const targetUser = await userRepository.findOne({
            where: { 
                id: targetUserId,
                company: { id: req.user.companyId }
            }
        });

        if (!targetUser) {
            throw new AppError(404, 'User not found');
        }

        // Prevent self-modification
        if (targetUser.id === req.user.id) {
            throw new AppError(400, 'You cannot modify your own role or status');
        }

        // Create audit log
        const auditLog = new UserAuditLog();
        auditLog.target_user_id = targetUser.id;
        auditLog.performed_by_id = req.user.id;
        auditLog.action = role !== targetUser.role ? 'role_update' : 'status_update';
        auditLog.changes = {
            previous: {
                role: targetUser.role,
                status: targetUser.status
            },
            new: {
                role,
                status
            }
        };
        auditLog.reason = reason;

        // Update user
        const previousStatus = targetUser.status;
        targetUser.role = role;
        targetUser.status = status;

        // Save changes in a transaction
        await AppDataSource.transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.save(targetUser);
            await transactionalEntityManager.save(auditLog);
        });

        // Send email notification if status changed
        if (previousStatus !== status) {
            await sendUserStatusChangeEmail(
                targetUser.email,
                status,
                reason
            ).catch(error => {
                console.error('Failed to send status change email:', error);
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            data: {
                id: targetUser.id,
                email: targetUser.email,
                role: targetUser.role,
                status: targetUser.status
            }
        });
    } catch (error) {
        next(error);
    }
};

export const removeUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);
    const auditRepository = AppDataSource.getRepository(UserAuditLog);

    try {
        const { reason } = req.body;
        const targetUserId = req.params.userId;

        const targetUser = await userRepository.findOne({
            where: { 
                id: targetUserId,
                company: { id: req.user.companyId }
            }
        });

        if (!targetUser) {
            throw new AppError(404, 'User not found');
        }

        // Prevent self-removal
        if (targetUser.id === req.user.id) {
            throw new AppError(400, 'You cannot remove yourself from the company');
        }

        // Create audit log
        const auditLog = new UserAuditLog();
        auditLog.target_user_id = targetUser.id;
        auditLog.performed_by_id = req.user.id;
        auditLog.action = 'removal';
        auditLog.changes = {
            previous: {
                status: targetUser.status
            },
            new: {
                status: 'inactive'
            }
        };
        auditLog.reason = reason;

        // Soft delete user
        targetUser.status = 'inactive';

        // Save changes in a transaction
        await AppDataSource.transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.save(targetUser);
            await transactionalEntityManager.save(auditLog);
        });

        // Send email notification
        await sendUserStatusChangeEmail(
            targetUser.email,
            'inactive',
            reason
        ).catch(error => {
            console.error('Failed to send removal notification email:', error);
        });

        res.json({
            success: true,
            message: 'User removed successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const getUserAuditLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const auditRepository = AppDataSource.getRepository(UserAuditLog);
        
        const logs = await auditRepository.find({
            where: {
                targetUser: { company: { id: req.user.companyId } }
            },
            relations: ['targetUser', 'performedBy'],
            order: { created_at: 'DESC' },
            take: 100 // Limit to last 100 entries
        });

        res.json({
            success: true,
            data: logs.map(log => ({
                id: log.id,
                targetUser: {
                    id: log.targetUser.id,
                    email: log.targetUser.email
                },
                performedBy: {
                    id: log.performedBy.id,
                    email: log.performedBy.email
                },
                action: log.action,
                changes: log.changes,
                reason: log.reason,
                created_at: log.created_at
            }))
        });
    } catch (error) {
        next(error);
    }
};