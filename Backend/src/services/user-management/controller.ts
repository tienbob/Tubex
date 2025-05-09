import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../database/ormconfig';
import { User } from '../../database/models/sql/user';
import { UserAuditLog } from '../../database/models/sql/userAudit';
import { AppError } from '../../middleware/errorHandler';
import { sendUserStatusChangeEmail } from '../email/service';
import { AuthenticatedRequest } from '../../types/express';
import { In } from 'typeorm';

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
    // Initialize query runner for transaction
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const { role, status, reason } = req.body;
        const targetUserId = req.params.userId;

        // Find target user within transaction
        const targetUser = await queryRunner.manager.findOne(User, {
            where: { 
                id: targetUserId,
                company: { id: req.user.companyId } // Tenant isolation
            }
        });

        if (!targetUser) {
            throw new AppError(404, 'User not found');
        }

        // Prevent self-modification
        if (targetUser.id === req.user.id) {
            throw new AppError(400, 'You cannot modify your own role or status');
        }

        // Create audit log within the same transaction
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
        // Set reason as a separate property instead of inside changes object
        auditLog.reason = reason;
        
        // Store original values for notification
        const previousRole = targetUser.role;
        const previousStatus = targetUser.status;

        // Update user
        targetUser.role = role;
        targetUser.status = status;

        // Save both the user and audit log within the transaction
        await queryRunner.manager.save(targetUser);
        await queryRunner.manager.save(auditLog);

        // Commit the transaction
        await queryRunner.commitTransaction();

        // Send notification AFTER successful database transaction
        if (previousStatus !== status) {
            try {
                await sendUserStatusChangeEmail(targetUser.email, status, reason);
            } catch (emailError) {
                console.error('Failed to send status change email:', emailError);
                // Don't throw error as the main operation succeeded
            }
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            data: {
                id: targetUser.id,
                role: targetUser.role,
                status: targetUser.status
            }
        });
    } catch (error) {
        // Rollback transaction in case of any error
        await queryRunner.rollbackTransaction();
        next(error);
    } finally {
        // Release resources regardless of outcome
        await queryRunner.release();
    }
};

export const removeUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Initialize query runner for transaction
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const { reason } = req.body;
        const targetUserId = req.params.userId;

        const targetUser = await queryRunner.manager.findOne(User, {
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
                status: targetUser.status,
                role: targetUser.role
            }
        };
        // Set reason as a separate property instead of inside changes object
        auditLog.reason = reason;

        // Soft delete: Update status to 'removed' instead of actual deletion
        targetUser.status = 'removed';
        
        // Save both changes in transaction
        await queryRunner.manager.save(targetUser);
        await queryRunner.manager.save(auditLog);
        
        // Commit transaction
        await queryRunner.commitTransaction();

        res.json({
            success: true,
            message: 'User removed successfully'
        });
    } catch (error) {
        // Rollback on error
        await queryRunner.rollbackTransaction();
        next(error);
    } finally {
        // Always release resources
        await queryRunner.release();
    }
};

export const getUserAuditLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const auditRepository = AppDataSource.getRepository(UserAuditLog);
        const userRepository = AppDataSource.getRepository(User);
        
        // Verify the company context - only show logs for users in the same company
        const companyUsers = await userRepository.find({
            where: { company: { id: req.user.companyId } },
            select: ['id']
        });
        
        const userIds = companyUsers.map(user => user.id);
        
        // Fixed query using TypeORM's In operator
        const logs = await auditRepository.find({
            where: { target_user_id: In(userIds) },
            order: { created_at: 'DESC' }
        });
        
        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        next(error);
    }
};