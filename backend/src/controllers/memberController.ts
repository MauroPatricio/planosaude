import { type Request, type Response } from 'express';
import Member from '../models/Member.js';
import logger from '../utils/logger.js';

interface AuthRequest extends Request {
  user?: any;
  tenantId?: string;
}

export const getMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.query;
    const query: any = {};
    if (req.tenantId) query.tenant = req.tenantId;
    if (clientId) query.primaryClient = clientId;
    if (req.user.role === 'client') query.primaryClient = req.user.clientId;

    const members = await Member.find(query).sort({ name: 1 });
    res.json(members);
  } catch (error: any) {
    logger.error(`Get Members Error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createMember = async (req: AuthRequest, res: Response) => {
  try {
    const { primaryClient, name, birthDate, relationship, documentNumber, phone } = req.body;
    
    const member = await Member.create({
      primaryClient,
      name,
      birthDate,
      relationship,
      documentNumber,
      phone,
      tenant: req.tenantId,
      status: 'active'
    });

    res.status(201).json(member);
  } catch (error: any) {
    logger.error(`Create Member Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao criar membro' });
  }
};

export const updateMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const member = await Member.findOneAndUpdate(
      { _id: id, tenant: req.tenantId },
      updateData,
      { new: true }
    );

    if (!member) return res.status(404).json({ message: 'Membro não encontrado' });
    res.json(member);
  } catch (error: any) {
    logger.error(`Update Member Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao atualizar membro' });
  }
};

export const deleteMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const member = await Member.findOneAndDelete({ _id: id, tenant: req.tenantId });
    if (!member) return res.status(404).json({ message: 'Membro não encontrado' });
    res.json({ message: 'Membro removido com sucesso' });
  } catch (error: any) {
    logger.error(`Delete Member Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao remover membro' });
  }
};
