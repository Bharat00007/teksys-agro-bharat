import { Response } from 'express';
import { cartService } from '../services/cart.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const cartController = {
  async getCart(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await cartService.getCart(req.user!.userId);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async addItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { product_id, quantity } = req.body;
      const data = await cartService.addItem(req.user!.userId, product_id, quantity);
      sendSuccess(res, data, 'Item added to cart');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async updateItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { quantity } = req.body;
      const data = await cartService.updateItemQuantity(req.user!.userId, req.params.productId, quantity);
      sendSuccess(res, data, 'Cart updated');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async removeItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await cartService.removeItem(req.user!.userId, req.params.productId);
      sendSuccess(res, data, 'Item removed from cart');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async clearCart(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await cartService.clearCart(req.user!.userId);
      sendSuccess(res, data, 'Cart cleared');
    } catch (err: any) { sendError(res, err.message, 400); }
  },
};
