import { Request, Response } from 'express';
import { productService } from '../services/product.service';
import { sendSuccess, sendError } from '../utils/response';

export const productController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await productService.getAll(req.query as any);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const data = await productService.getById(req.params.id);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 404); }
  },

  async getSimilar(req: Request, res: Response): Promise<void> {
    try {
      const data = await productService.getSimilar(req.params.id, Number(req.query.limit) || 10);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getFeatured(req: Request, res: Response): Promise<void> {
    try {
      const data = await productService.getFeatured(Number(req.query.limit) || 10);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getTrending(req: Request, res: Response): Promise<void> {
    try {
      const data = await productService.getTrending(Number(req.query.limit) || 10);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getBestSellers(req: Request, res: Response): Promise<void> {
    try {
      const data = await productService.getBestSellers(Number(req.query.limit) || 10);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getRecentlyAdded(req: Request, res: Response): Promise<void> {
    try {
      const data = await productService.getRecentlyAdded(Number(req.query.limit) || 10);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async searchSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const data = await productService.searchSuggestions(req.query.q as string || '', Number(req.query.limit) || 10);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  // Admin
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = await productService.create(req.body);
      sendSuccess(res, data, 'Product created', 201);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const data = await productService.update(req.params.id, req.body);
      sendSuccess(res, data, 'Product updated');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const data = await productService.delete(req.params.id);
      sendSuccess(res, data, 'Product deleted');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async addImage(req: Request, res: Response): Promise<void> {
    try {
      const data = await productService.addImage(req.params.id, req.body);
      sendSuccess(res, data, 'Image added', 201);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async deleteImage(req: Request, res: Response): Promise<void> {
    try {
      const data = await productService.deleteImage(req.params.imageId);
      sendSuccess(res, data, 'Image deleted');
    } catch (err: any) { sendError(res, err.message, 400); }
  },
};
