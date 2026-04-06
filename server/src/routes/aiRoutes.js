import { Router } from 'express';
import {
  generateDescription,
  valuationInsights,
  analysePhotos,
  recommendProperties,
  nlSearch,
  ragChat,
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { aiRateLimit } from '../middleware/rateLimit.js';

const router = Router();

router.use(protect, aiRateLimit);

router.post('/properties/:id/description', requireRole('agent', 'seller'), generateDescription);
router.post('/properties/:id/valuation', valuationInsights);
router.post('/properties/:id/analyse-photos', requireRole('agent', 'seller'), analysePhotos);
router.get('/recommendations', recommendProperties);
router.post('/search', nlSearch);
router.post('/chat', ragChat);

export default router;
