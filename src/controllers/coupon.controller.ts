import { Request, Response } from 'express';
import { couponService } from '../services/coupon.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const couponController = {
  async validate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await couponService.validate(req.user!.userId, req.body.code, req.body.order_amount);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getAvailable(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await couponService.getAvailableCoupons(req.user!.userId);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  // Admin
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const data = await couponService.getAll();
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = await couponService.create(req.body);
      sendSuccess(res, data, 'Coupon created', 201);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const data = await couponService.update(req.params.id, req.body);
      sendSuccess(res, data, 'Coupon updated');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const data = await couponService.delete(req.params.id);
      sendSuccess(res, data, 'Coupon deleted');
    } catch (err: any) { sendError(res, err.message, 400); }
  },
};
