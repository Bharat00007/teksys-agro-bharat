import { Request, Response } from 'express';
import { categoryService } from '../services/category.service';
import { sendSuccess, sendError } from '../utils/response';

export const categoryController = {
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const data = await categoryService.getAll();
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const data = await categoryService.getById(req.params.id);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 404); }
  },

  async getBySlug(req: Request, res: Response): Promise<void> {
    try {
      const data = await categoryService.getBySlug(req.params.slug);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 404); }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = await categoryService.create(req.body);
      sendSuccess(res, data, 'Category created', 201);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const data = await categoryService.update(req.params.id, req.body);
      sendSuccess(res, data, 'Category updated');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const data = await categoryService.delete(req.params.id);
      sendSuccess(res, data, 'Category deleted');
    } catch (err: any) { sendError(res, err.message, 400); }
  },
};
