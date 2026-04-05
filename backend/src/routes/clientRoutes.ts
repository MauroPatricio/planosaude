import express from 'express';
import { createClient, getClients, getClientById, updateClient, deleteClient } from '../controllers/clientController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createClient)
  .get(protect, getClients);

router.route('/:id')
  .get(protect, getClientById)
  .patch(protect, updateClient)
  .delete(protect, deleteClient);

export default router;
