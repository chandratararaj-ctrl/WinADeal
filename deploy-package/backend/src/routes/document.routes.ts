import { Router } from 'express';
import { uploadDocument, getMyDocuments } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../utils/upload';

const router = Router();

// Routes
router.post('/upload', authenticate, upload.single('file'), uploadDocument);
router.get('/', authenticate, getMyDocuments);

export default router;
