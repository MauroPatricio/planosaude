import { type Request, type Response } from 'express';
import User from '../models/User.js';
import logger from '../utils/logger.js';

interface AuthRequest extends Request {
  user?: any;
  tenantId?: string;
}

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ tenant: req.tenantId }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error: any) {
    logger.error(`Get Users Error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  console.log('--- POST /api/users INICIADO ---');
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Um utilizador com este email já existe.' });
    }

    if (!['admin', 'manager', 'broker'].includes(role)) {
      return res.status(400).json({ message: 'A função (role) fornecida é inválida.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      tenant: req.tenantId
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
  } catch (error: any) {
    logger.error(`Create User Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao registar utilizador', error: error.message });
  }
};


export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;
    
    const user = await User.findOne({ _id: id, tenant: req.tenantId });

    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    if (role) {
      if (!['admin', 'manager', 'broker'].includes(role)) {
        return res.status(400).json({ message: 'A função (role) fornecida é inválida.' });
      }
      user.role = role;
    }
    
    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    await user.save();
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });

  } catch (error: any) {
    logger.error(`Update User Error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};


export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await User.findOne({ _id: id, tenant: req.tenantId });

    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }
    
    if (user._id.toString() === req.user._id.toString()) {
       return res.status(400).json({ message: 'Não pode excluir a sua própria conta.' });
    }

    await user.deleteOne();
    
    res.json({ message: 'Utilizador removido com sucesso.' });

  } catch (error: any) {
    logger.error(`Delete User Error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};
