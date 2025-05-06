import { Router, RequestHandler } from 'express';
import { orderController } from './controller';
import { orderValidators } from './validators';
import { validateRequest } from '../../middleware/validation';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Require authentication for all order routes
router.use(authenticate);

// Only allow dealers to access order routes
router.use(authorize('dealer'));

// Create new order
router.post(
    '/',
    validateRequest(orderValidators.createOrder),
    orderController.createOrder as RequestHandler
);

// Update order
router.patch(
    '/:id',
    validateRequest(orderValidators.updateOrder),
    orderController.updateOrder as RequestHandler
);

// Get single order
router.get('/:id', orderController.getOrder as RequestHandler);

// List orders with pagination and filtering
router.get('/', orderController.listOrders as RequestHandler);

// Cancel order
router.post('/:id/cancel', orderController.cancelOrder as RequestHandler);

export const orderRoutes = router;