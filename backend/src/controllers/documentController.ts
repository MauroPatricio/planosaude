import { type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Document from '../models/Document.js';
import logger from '../utils/logger.js';

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Apenas ficheiros JPG, PNG e PDF são permitidos!'));
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('file');

interface AuthRequest extends Request {
  user?: any;
  tenantId?: string;
}

export const uploadDocument = (req: AuthRequest, res: Response) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum ficheiro enviado' });
    }

    try {
      const { type, entityType, entityId } = req.body;

      const newDoc = await Document.create({
        name: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
        type: type || 'other',
        entityType,
        entityId,
        tenant: req.tenantId,
        uploadedBy: req.user._id,
        status: 'pending'
      });

      res.status(201).json(newDoc);
    } catch (error: any) {
      logger.error(`Upload Document Error: ${error.message}`);
      res.status(500).json({ message: 'Erro ao guardar metadados do documento' });
    }
  });
};

export const getDocumentsByEntity = async (req: AuthRequest, res: Response) => {
  try {
    const { entityId } = req.params;
    const documents = await Document.find({ 
      entityId, 
      tenant: req.tenantId 
    }).sort({ createdAt: -1 });

    res.json(documents);
  } catch (error: any) {
    logger.error(`Get Documents Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao procurar documentos' });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const document = await Document.findOne({ _id: id, tenant: req.tenantId });

    if (!document) {
      return res.status(404).json({ message: 'Documento não encontrado' });
    }

    // Delete from FS
    const filePath = path.join('uploads', document.name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await document.deleteOne();
    res.json({ message: 'Documento removido com sucesso' });
  } catch (error: any) {
    logger.error(`Delete Document Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao remover documento' });
  }
};
