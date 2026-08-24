import { Response } from 'express';
import { notificationService } from '../services/notification.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const notificationController = {
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const data = await notificationService.getAll(req.user!.userId, page, limit);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await notificationService.markAsRead(req.user!.userId, req.params.id);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await notificationService.markAllAsRead(req.user!.userId);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await notificationService.getUnreadCount(req.user!.userId);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },
};
