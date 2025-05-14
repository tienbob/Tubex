import { Router } from 'express';
import { warehouseRoutes } from '../services/warehouse/routes';

const router = Router();

// Register warehouse routes with PLURAL path
router.use('/v1/warehouses', warehouseRoutes);

export default router;