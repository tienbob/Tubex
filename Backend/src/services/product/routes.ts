import { Router } from 'express';
import { productController } from './controller';
import { productValidators } from './validators';
import { validateRequest } from '../../middleware/validation';
import { authenticate, authorize } from '../../middleware/auth';
import { RequestHandler } from 'express';

const router = Router();

// Apply authentication to all product routes
router.use(authenticate);

// List products (accessible by both dealers and suppliers)
router.get('/', productController.listProducts as RequestHandler);

// Get single product (accessible by both dealers and suppliers)
router.get('/:id', productController.getProduct as RequestHandler);

// Protected routes - only suppliers can create/update/delete products
router.post(
    '/',
    authorize('supplier'),
    validateRequest(productValidators.createProduct),
    productController.createProduct as RequestHandler
);

router.put(
    '/:id',
    authorize('supplier'),
    validateRequest(productValidators.updateProduct),
    productController.updateProduct as RequestHandler
);

router.delete(
    '/:id',
    authorize('supplier'),
    productController.deleteProduct as RequestHandler
);

export const productRoutes = router;