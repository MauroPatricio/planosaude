import { type Request, type Response } from 'express';
import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';
import { getIO } from '../utils/socket.js';

interface AuthRequest extends Request {
  user?: any;
  tenantId?: string;
}

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find({
      tenant: req.tenantId,
      recipient: req.user._id
    }).sort({ createdAt: -1 }).limit(20);

    res.json(notifications);
  } catch (error: any) {
    logger.error(`Get Notifications Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao carregar notificações' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error: any) {
    logger.error(`Mark Notification Read Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao atualizar notificação' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error: any) {
    logger.error(`Mark All Read Error: ${error.message}`);
    res.status(500).json({ message: 'Erro ao atualizar notificações' });
  }
};

/**
 * Helper to send notification (DB + Socket)
 */
export const sendNotification = async ({
  tenantId,
  recipientId,
  type,
  title,
  message,
  link
}: {
  tenantId: string;
  recipientId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
}) => {
  try {
    const notification = await Notification.create({
      tenant: tenantId,
      recipient: recipientId,
      type,
      title,
      message,
      link
    });

    const io = getIO();
    // Emit to specific user room and tenant room
    const userRoom = `user:${recipientId}`;
    io.to(userRoom).emit('notification:new', notification);
    
    return notification;
  } catch (error: any) {
    logger.error(`Send Notification Helper Error: ${error.message}`);
  }
};
