import { Router } from 'express';

const router = Router();

// Placeholder routes - to be implemented
router.get('/', (req, res) => {
  res.json({ message: 'Product routes - to be implemented' });
});

export const productRoutes = router;