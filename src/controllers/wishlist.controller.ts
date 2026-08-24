import { Response } from 'express';
import { wishlistService } from '../services/wishlist.service';
import { cartService } from '../services/cart.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const wishlistController = {
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await wishlistService.getAll(req.user!.userId);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async add(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await wishlistService.add(req.user!.userId, req.body.product_id);
      sendSuccess(res, data, 'Added to wishlist', 201);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async remove(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await wishlistService.remove(req.user!.userId, req.params.productId);
      sendSuccess(res, data, 'Removed from wishlist');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async check(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await wishlistService.isInWishlist(req.user!.userId, req.params.productId);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async moveToCart(req: AuthRequest, res: Response): Promise<void> {
    try {
      await wishlistService.remove(req.user!.userId, req.params.productId);
      const cart = await cartService.addItem(req.user!.userId, req.params.productId, 1);
      sendSuccess(res, cart, 'Moved to cart');
    } catch (err: any) { sendError(res, err.message, 400); }
  },
};
