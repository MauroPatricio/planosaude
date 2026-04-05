import { type Request, type Response } from 'express';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

const generateToken = (id: string, tenantId: string) => {
  return jwt.sign({ id, tenantId }, process.env.JWT_SECRET || 'supersecretplanosaude2024', {
    expiresIn: '30d'
  });
};

export const registerTenant = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { 
      companyName, companyType, country, currency, contactEmail, contactPhone,
      adminName, adminEmail, password 
    } = req.body;

    // Check if user or tenant email already exists
    const userExists = await User.findOne({ email: adminEmail }).session(session);
    if (userExists) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'O email do administrador já está em uso' });
    }

    const tenantExists = await Tenant.findOne({ contactEmail }).session(session);
    if (tenantExists) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'O email da organização já está em uso' });
    }

    // 1. Create Tenant
    const tenant = await Tenant.create([{
      name: companyName,
      type: companyType,
      country: country || 'Moçambique',
      currency: currency || 'MT',
      contactEmail,
      contactPhone
    }], { session });

    // 2. Create Admin User for the Tenant
    const user = await User.create([{
      name: adminName,
      email: adminEmail,
      password,
      role: 'admin',
      tenant: tenant[0]!._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      _id: user[0]!._id,
      name: user[0]!.name,
      email: user[0]!.email,
      role: user[0]!.role,
      tenantId: tenant[0]!._id,
      token: generateToken(user[0]!._id.toString(), tenant[0]!._id.toString())
    });

  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    logger.error(`Register Tenant Error: ${error}`);
    res.status(500).json({ message: 'Erro ao criar a conta', error: error.message });
  }
};

export const registerUser = async (req: any, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Utilizador já existe' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      tenant: req.tenantId // Brokers/Managers inherit the tenant of the creator
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenant,
        clientId: user.clientId,
        token: generateToken(user._id.toString(), user.tenant.toString())
      });
    }
  } catch (error: any) {
    logger.error(`Register User Error: ${error}`);
    res.status(500).json({ message: 'Erro de servidor', error: error.message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenant ? user.tenant.toString() : null,
        clientId: user.clientId ? user.clientId.toString() : null,
        token: generateToken(user._id.toString(), user.tenant ? user.tenant.toString() : '')
      });
    } else {
      res.status(401).json({ message: 'Email ou palavra-passe inválidos' });
    }
  } catch (error: any) {
    logger.error(`Login User Error: ${error.stack || error}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error: any) {
    logger.error(`Get Profile Error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};
