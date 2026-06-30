import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  startInterview,
  handleMessage,
  endInterview,
  getSessions,
  getFeedback,
  getProfile
} from '../controllers/interviewController.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Protect all interview routes
router.use(authMiddleware);

router.post('/start', startInterview);
router.post('/message', upload.single('audio'), handleMessage);
router.post('/end', endInterview);
router.get('/sessions', getSessions);
router.get('/feedback/:id', getFeedback);
router.get('/profile', getProfile);

export default router;
