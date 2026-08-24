import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';
import { signToken } from '../config/jwt';
import { getMaxWeightForVehicle } from '../types';

export const authService = {

  async registerFarmer(dto: {
    name: string; phone: string; email: string; password: string;
    area: string; village?: string;
    bank_account_number?: string; ifsc_code?: string;
    account_holder_name?: string; bank_name?: string;
  }) {
    const { data: existing } = await supabase
      .from('users').select('id').eq('email', dto.email).single();
    if (existing) throw new Error('Email already registered');

    const { data: existingPhone } = await supabase
      .from('users').select('id').eq('phone', dto.phone).single();
    if (existingPhone) throw new Error('Phone number already registered');

    const { data: user, error } = await supabase
      .from('users')
      .insert({ name: dto.name, phone: dto.phone, email: dto.email, role: 'farmer' })
      .select().single();
    if (error) throw new Error(error.message);

    const hash = await bcrypt.hash(dto.password, 12);
    await supabase.from('user_passwords').insert({ user_id: user.id, password_hash: hash });

    await supabase.from('farmer_profiles').insert({
      user_id: user.id, area: dto.area, village: dto.village,
    });

    if (dto.account_holder_name || dto.bank_account_number || dto.ifsc_code || dto.bank_name) {
      await supabase.from('farmer_bank_details').insert({
        farmer_id: user.id,
        account_holder_name: dto.account_holder_name || '',
        bank_account_number: dto.bank_account_number || '',
        ifsc_code: dto.ifsc_code || '',
        bank_name: dto.bank_name || '',
      });
    }

    const token = signToken({ userId: user.id, email: user.email, phone: user.phone, role: 'farmer', name: user.name });
    return { user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: 'farmer' }, token };
  },

  async registerAgent(dto: {
    name: string; phone: string; email: string; password: string;
    vehicle_type: string; current_area?: string;
  }) {
    const { data: existing } = await supabase
      .from('users').select('id').eq('email', dto.email).single();
    if (existing) throw new Error('Email already registered');

    const { data: existingPhone } = await supabase
      .from('users').select('id').eq('phone', dto.phone).single();
    if (existingPhone) throw new Error('Phone number already registered');

    const validVehicles = ['bike', 'three_wheeler', 'mini_truck', 'truck'];
    if (!validVehicles.includes(dto.vehicle_type)) throw new Error('Invalid vehicle type');

    const maxWeight = getMaxWeightForVehicle(dto.vehicle_type as any);

    const { data: user, error } = await supabase
      .from('users')
      .insert({ name: dto.name, phone: dto.phone, email: dto.email, role: 'agent' })
      .select().single();
    if (error) throw new Error(error.message);

    const hash = await bcrypt.hash(dto.password, 12);
    await supabase.from('user_passwords').insert({ user_id: user.id, password_hash: hash });

    await supabase.from('agent_profiles').insert({
      user_id: user.id,
      vehicle_type: dto.vehicle_type,
      max_weight_kg: maxWeight,
      current_area: dto.current_area,
    });

    const token = signToken({ userId: user.id, email: user.email, phone: user.phone, role: 'agent', name: user.name });
    return { user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: 'agent' }, token };
  },

  async login(dto: { email: string; password: string; role: string }) {
    const { data: user } = await supabase
      .from('users').select('*')
      .eq('email', dto.email).eq('role', dto.role).single();
    if (!user) throw new Error('Invalid email or password');

    const { data: pwData } = await supabase
      .from('user_passwords').select('password_hash').eq('user_id', user.id).single();
    if (!pwData) throw new Error('Invalid email or password');

    const valid = await bcrypt.compare(dto.password, pwData.password_hash);
    if (!valid) throw new Error('Invalid email or password');

    let profile = null;
    if (user.role === 'farmer') {
      const { data } = await supabase.from('farmer_profiles').select('*').eq('user_id', user.id).single();
      profile = data;
    } else if (user.role === 'agent') {
      const { data } = await supabase.from('agent_profiles').select('*').eq('user_id', user.id).single();
      profile = data;
    }

    const token = signToken({ userId: user.id, email: user.email, phone: user.phone, role: user.role, name: user.name });
    return { user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }, profile, token };
  },
};
