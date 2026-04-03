import express from 'express';
import { createClient, getClients, getClientById, updateClient } from '../controllers/clientController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createClient)
  .get(protect, getClients);

router.route('/:id')
  .get(protect, getClientById)
  .patch(protect, updateClient);

export default router;
