import { type Request, type Response } from 'express';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import Client from '../models/Client.js';
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
        status: user.status || 'active',
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
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('clientId');
    res.json(user);
  } catch (error: any) {
    logger.error(`Get Profile Error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const registerClient = async (req: Request, res: Response) => {
  let createdClientId: string | null = null;
  
  try {
    const { 
      name, email, password, phone, 
      documentType = 'BI', documentNumber, nuit, address,
      planType, institutionId, tenantId 
    } = req.body;

    // Check if user or client already exists with this email
    const userExists = await User.findOne({ email });
    const clientEmailExists = await Client.findOne({ email });
    
    if (userExists || clientEmailExists) {
      return res.status(400).json({ message: 'Este email já está registado no sistema' });
    }

    // Check if another client already has this document number
    if (documentNumber) {
      const docExists = await Client.findOne({ documentId: documentNumber });
      if (docExists) {
        return res.status(400).json({ message: 'Este número de documento já está em uso' });
      }
    }

    // Default tenant if none provided (the main app tenant)
    const defaultTenant = await Tenant.findOne();
    if (!defaultTenant && !tenantId) {
      return res.status(400).json({ message: 'Nenhum tenant (organização) configurado no sistema' });
    }
    const finalTenantId = tenantId || defaultTenant!._id;

    // Handle files if present
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const documents = {
      identificationFrontUrl: (files?.idFront && files.idFront[0]) ? `/uploads/${files.idFront[0].filename}` : undefined,
      identificationBackUrl: (files?.idBack && files.idBack[0]) ? `/uploads/${files.idBack[0].filename}` : undefined,
      addressProofUrl: (files?.addressProof && files.addressProof[0]) ? `/uploads/${files.addressProof[0].filename}` : undefined,
    };
    const profileImage = (files?.profilePhoto && files.profilePhoto[0]) ? `/uploads/${files.profilePhoto[0].filename}` : undefined;

    // Attempt to find an admin for this tenant, fallback to any admin or superAdmin
    let broker = await User.findOne({ role: 'admin', tenant: finalTenantId });
    if (!broker) {
      broker = await User.findOne({ role: { $in: ['admin', 'superAdmin'] } });
    }

    if (!broker) {
      return res.status(400).json({ message: 'Nenhum gestor/corretor disponível para atribuir a conta' });
    }

    // 1. Create Client record
    const client = await Client.create({
      name,
      email,
      phone,
      documentId: documentNumber,
      nuit,
      address,
      status: 'pending',
      planType,
      documents,
      institution: institutionId || null,
      tenant: finalTenantId,
      broker: broker._id,
      history: [{ action: 'registration', note: 'Cliente registado via aplicação móvel' }]
    });

    createdClientId = (client._id as any).toString();

    // 2. Create User record
    const user = await User.create({
      name,
      email,
      password,
      role: 'client',
      tenant: finalTenantId,
      clientId: client._id,
      status: 'pending',
      address,
      profileImage,
      documentType,
      documentNumber,
      nuit,
      planType
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: 'pending',
      token: generateToken(user._id.toString(), finalTenantId.toString())
    });

  } catch (error: any) {
    // Manual Rollback: delete the client if it was created but the user failed
    if (createdClientId) {
      try {
        await Client.findByIdAndDelete(createdClientId);
        console.log(`Rollback: Client ${createdClientId} deleted because user creation failed.`);
      } catch (rollbackErr) {
        console.error('CRITICAL: Rollback failed:', rollbackErr);
      }
    }

    // Log detailed error for debugging
    console.error('CRITICAL: Register Client Error:', error);
    if (error.name === 'ValidationError') {
      console.error('Validation Details:', Object.keys(error.errors).map(key => `${key}: ${error.errors[key].message}`).join(', '));
    }

    logger.error(`Register Client Error: ${error.stack}`);
    res.status(500).json({ 
      message: 'Erro ao criar conta de cliente', 
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => error.errors[key].message) : []
    });
  }
};

export const updateProfileDocuments = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilizador não encontrado' });

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const updateData: any = {};
    const clientUpdateData: any = {};

    if (files?.profilePhoto && files.profilePhoto[0]) {
      updateData.profileImage = `/uploads/${files.profilePhoto[0].filename}`;
    }

    if (files?.idFront && files.idFront[0]) {
      clientUpdateData['documents.identificationFrontUrl'] = `/uploads/${files.idFront[0].filename}`;
    }
    if (files?.idBack && files.idBack[0]) {
      clientUpdateData['documents.identificationBackUrl'] = `/uploads/${files.idBack[0].filename}`;
    }
    if (files?.addressProof && files.addressProof[0]) {
      clientUpdateData['documents.addressProofUrl'] = `/uploads/${files.addressProof[0].filename}`;
    }

    // Update User
    if (Object.keys(updateData).length > 0) {
      await User.findByIdAndUpdate(userId, updateData);
    }

    // Update Client
    if (user.clientId && Object.keys(clientUpdateData).length > 0) {
      await Client.findByIdAndUpdate(user.clientId, { $set: clientUpdateData });
    }

    const updatedUser = await User.findById(userId).select('-password').populate('clientId');
    res.json({
      message: 'Documentos atualizados com sucesso',
      user: updatedUser
    });

  } catch (error: any) {
    logger.error(`Update Profile Documents Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao atualizar documentos' });
  }
};
