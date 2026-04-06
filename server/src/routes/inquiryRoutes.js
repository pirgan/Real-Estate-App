import { Router } from 'express';
import {
  createInquiry,
  getForProperty,
  getForBuyer,
  replyToInquiry,
} from '../controllers/inquiryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = Router();

router.post('/properties/:propertyId', protect, createInquiry);
router.get('/properties/:propertyId', protect, requireRole('agent', 'seller'), getForProperty);
router.get('/my', protect, getForBuyer);
router.patch('/:id/reply', protect, requireRole('agent'), replyToInquiry);

export default router;
