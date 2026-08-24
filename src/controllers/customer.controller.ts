import { Request, Response } from 'express';
import { customerService } from '../services/customer.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const customerController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const data = await customerService.register(req.body);
      sendSuccess(res, data, 'Customer registered successfully', 201);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const data = await customerService.login(req.body);
      sendSuccess(res, data, 'Login successful');
    } catch (err: any) { sendError(res, err.message, 401); }
  },

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await customerService.getProfile(req.user!.userId);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await customerService.updateProfile(req.user!.userId, req.body);
      sendSuccess(res, data, 'Profile updated');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async addAddress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await customerService.addAddress(req.user!.userId, req.body);
      sendSuccess(res, data, 'Address added', 201);
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async updateAddress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await customerService.updateAddress(req.user!.userId, req.params.addressId, req.body);
      sendSuccess(res, data, 'Address updated');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async deleteAddress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await customerService.deleteAddress(req.user!.userId, req.params.addressId);
      sendSuccess(res, data, 'Address deleted');
    } catch (err: any) { sendError(res, err.message, 400); }
  },

  async getAddresses(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await customerService.getAddresses(req.user!.userId);
      sendSuccess(res, data);
    } catch (err: any) { sendError(res, err.message, 400); }
  },
};
