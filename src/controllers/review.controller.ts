import { Request, Response } from 'express';
import { reviewService } from '../services/review.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const reviewController = {
  async getProductReviews(req: Request, res: Response): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const data = await reviewService.getProductReviews(req.params.productId, page, limit);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await reviewService.create(req.user!.userId, req.body);
      sendSuccess(res, data, 'Review submitted', 201);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await reviewService.update(req.user!.userId, req.params.id, req.body);
      sendSuccess(res, data, 'Review updated');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await reviewService.delete(req.user!.userId, req.params.id);
      sendSuccess(res, data, 'Review deleted');
    } catch (err: any) { sendError(res, err.message, 400); }
  },
};
