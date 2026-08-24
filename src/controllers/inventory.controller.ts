import { Response } from 'express';
import { inventoryService } from '../services/inventory.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const inventoryController = {

  async getSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await inventoryService.getSummary();
      sendSuccess(res, data, 'Inventory summary fetched');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await inventoryService.getAll(req.query as any);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await inventoryService.getById(req.params.id);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 404); }
  },

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await inventoryService.create(req.body, req.user!.userId);
      sendSuccess(res, data, 'Inventory item created', 201);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await inventoryService.update(req.params.id, req.body, req.user!.userId);
      sendSuccess(res, data, 'Inventory item updated');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await inventoryService.delete(req.params.id, req.user!.userId);
      sendSuccess(res, data, 'Inventory item deleted');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async adjustStock(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await inventoryService.adjustStock(req.params.id, req.body, req.user!.userId);
      sendSuccess(res, data, 'Stock adjusted');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await inventoryService.getHistory(req.params.id, req.query as any);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getLowStock(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await inventoryService.getLowStock();
      sendSuccess(res, data, 'Low stock items fetched');
    } catch (err: any) { sendError(res, err.message, 400); }
  },
  async uploadImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await inventoryService.uploadImage(req.body);
      sendSuccess(res, data, 'Image uploaded', 201);
    } catch (err: any) { sendError(res, err.message, 400); }
  },
};
