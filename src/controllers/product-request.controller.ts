import { Response } from 'express';
import { productRequestService } from '../services/product-request.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const productRequestController = {

  // ── Customer ──────────────────────────────────────────────────

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await productRequestService.create(req.user!.userId, req.body);
      sendSuccess(res, data, 'Product request submitted successfully', 201);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await productRequestService.getAll(req.user!.userId, req.query as any);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await productRequestService.getById(req.user!.userId, req.params.id);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 404); }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await productRequestService.update(req.user!.userId, req.params.id, req.body);
      sendSuccess(res, data, 'Request updated');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async cancel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await productRequestService.cancel(req.user!.userId, req.params.id);
      sendSuccess(res, data, 'Request cancelled');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  // ── Admin ─────────────────────────────────────────────────────

  async getAllAdmin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await productRequestService.getAllAdmin(req.query as any);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getByIdAdmin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await productRequestService.getByIdAdmin(req.params.id);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 404); }
  },

  async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await productRequestService.updateStatus(req.params.id, req.body.status, req.body.admin_notes);
      sendSuccess(res, data, 'Request status updated');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async checkInventory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await productRequestService.checkInventoryMatch();
      sendSuccess(res, data, `Matched ${data.matched} request(s) with available inventory`);
    } catch (err: any) { sendError(res, err.message, 400); }
  },
};
