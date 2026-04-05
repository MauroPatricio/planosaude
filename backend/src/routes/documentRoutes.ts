import express from 'express';
import { uploadDocument, getDocumentsByEntity, deleteDocument } from '../controllers/documentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/upload', protect, uploadDocument);
router.get('/entity/:entityId', protect, getDocumentsByEntity);
router.delete('/:id', protect, deleteDocument);

export default router;
