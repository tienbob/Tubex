import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middleware/errorHandler';
import { AppDataSource } from '../../database/ormconfig';
import { User } from '../../database/models/sql';

// Helper function to extract name fields from user metadata
const extractNameFields = (user: any) => {
    const result = { ...user };

    // Extract firstName and lastName from metadata if they exist
    if (user.metadata) {
        result.firstName = user.metadata.firstName || '';
        result.lastName = user.metadata.lastName || '';
    } else {
        result.firstName = '';
        result.lastName = '';
    }

    return result;
};

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);

    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;        const [users, total] = await userRepository.findAndCount({
            select: ['id', 'email', 'role', 'status', 'created_at', 'updated_at', 'metadata'],
            relations: ['company'],
            skip,
            take: limit,
            order: { created_at: 'DESC' }
        });

        // Process users to extract name fields from metadata
        const processedUsers = users.map(extractNameFields);

        res.status(200).json({
            status: 'success',
            data: {
                users: processedUsers,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);

    try {
        const { id } = req.params;        
        const user = await userRepository.findOne({
            where: { id },
            select: ['id', 'email', 'role', 'status', 'created_at', 'updated_at', 'metadata'],
            relations: ['company']
        });

        if (!user) {
            throw new AppError(404, 'User not found');
        }

        // Process user to extract name fields from metadata
        const processedUser = extractNameFields(user);

        res.status(200).json({
            status: 'success',
            data: { user: processedUser }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);    try {
        const { id } = req.params;
        const { email, role, status } = req.body;

        const user = await userRepository.findOne({ 
            where: { id },
            select: ['id', 'email', 'role', 'status', 'created_at', 'updated_at', 'metadata']
        });
        if (!user) {
            throw new AppError(404, 'User not found');
        }

        // Only update provided fields
        if (email) user.email = email;
        if (role) user.role = role;
        if (status) user.status = status;        user.updated_at = new Date();
        await userRepository.save(user);

        // Process the updated user to include name fields
        const processedUser = extractNameFields(user);

        res.status(200).json({
            status: 'success',
            message: 'User updated successfully',
            data: {
                id: processedUser.id,
                email: processedUser.email,
                role: processedUser.role,
                status: processedUser.status,
                firstName: processedUser.firstName,
                lastName: processedUser.lastName
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);

    try {
        const { id } = req.params;

        const user = await userRepository.findOne({ where: { id } });
        if (!user) {
            throw new AppError(404, 'User not found');
        }

        await userRepository.remove(user);

        res.status(200).json({
            status: 'success',
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};