import { Router } from 'express';
import {
  getProperties,
  getById,
  createProperty,
  updateProperty,
  archiveProperty,
  searchProperties,
} from '../controllers/propertyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/', getProperties);
router.get('/search', searchProperties);
router.get('/:id', getById);
router.post('/', protect, requireRole('agent', 'seller'), createProperty);
router.put('/:id', protect, requireRole('agent', 'seller'), updateProperty);
router.patch('/:id/archive', protect, requireRole('agent', 'seller'), archiveProperty);

export default router;
