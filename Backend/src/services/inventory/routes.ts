import { Router } from 'express';

const router = Router();

// Placeholder routes - to be implemented
router.get('/', (req, res) => {
  res.json({ message: 'Inventory routes - to be implemented' });
});

export const inventoryRoutes = router;