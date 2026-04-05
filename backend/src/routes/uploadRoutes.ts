import express, { type Request, type Response } from 'express';
import { uploadMiddleware } from '../middlewares/uploadMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Upload multiple files (or single, but array handles both safely for different fields)
// We will use upload.fields to specify which fields we expect.
router.post(
  '/',
  protect,
  uploadMiddleware.fields([
    { name: 'identificationFront', maxCount: 1 },
    { name: 'identificationBack', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 }
  ]),
  (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const urls: { identificationFrontUrl?: string; identificationBackUrl?: string; addressProofUrl?: string } = {};

      if (files && files.identificationFront && files.identificationFront.length > 0) {
        urls.identificationFrontUrl = `/uploads/${files.identificationFront[0]!.filename}`;
      }

      if (files && files.identificationBack && files.identificationBack.length > 0) {
        urls.identificationBackUrl = `/uploads/${files.identificationBack[0]!.filename}`;
      }

      if (files && files.addressProof && files.addressProof.length > 0) {
        urls.addressProofUrl = `/uploads/${files.addressProof[0]!.filename}`;
      }

      res.status(200).json({
        success: true,
        message: 'Ficheiros carregados com sucesso',
        documents: urls
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Erro no upload: ' + error.message });
    }
  }
);

export default router;
