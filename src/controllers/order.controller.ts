import { Request, Response } from 'express';
import { orderService } from '../services/order.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const orderController = {
  async placeOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await orderService.placeOrder(req.user!.userId, req.body);
      sendSuccess(res, data, 'Order placed successfully', 201);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await orderService.getOrders(req.user!.userId, req.query.status as string);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getOrderById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await orderService.getOrderById(req.user!.userId, req.params.id);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 404); }
  },

  async cancelOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await orderService.cancelOrder(req.user!.userId, req.params.id, req.body.reason);
      sendSuccess(res, data, 'Order cancelled');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async reorder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await orderService.reorder(req.user!.userId, req.params.id);
      sendSuccess(res, data, 'Items added to cart');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  // Admin
  async getAllOrders(req: Request, res: Response): Promise<void> {
    try {
      const data = await orderService.getAllOrders(req.query as any);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const data = await orderService.updateOrderStatus(req.params.id, req.body.status);
      sendSuccess(res, data, 'Order status updated');
    } catch (err: any) { sendError(res, err.message, 400); }
  },
};
