import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';
import { signToken } from '../config/jwt';

export const customerService = {

  async register(dto: {
    name: string; phone: string; email: string; password: string;
  }) {
    const { data: existing } = await supabase
      .from('users').select('id').eq('email', dto.email).single();
    if (existing) throw new Error('Email already registered');

    const { data: existingPhone } = await supabase
      .from('users').select('id').eq('phone', dto.phone).single();
    if (existingPhone) throw new Error('Phone number already registered');

    const { data: user, error } = await supabase
      .from('users')
      .insert({ name: dto.name, phone: dto.phone, email: dto.email, role: 'customer' })
      .select().single();
    if (error) throw new Error(error.message);

    const hash = await bcrypt.hash(dto.password, 12);
    await supabase.from('user_passwords').insert({ user_id: user.id, password_hash: hash });

    // Create customer profile
    await supabase.from('customers').insert({ user_id: user.id });

    // Create empty cart
    await supabase.from('carts').insert({ customer_id: user.id });

    const token = signToken({
      userId: user.id, email: user.email, phone: user.phone,
      role: 'customer', name: user.name,
    });
    return {
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: 'customer' },
      token,
    };
  },

  async login(dto: { email?: string; phone?: string; password: string }) {
    let query = supabase.from('users').select('*').eq('role', 'customer');
    if (dto.email) query = query.eq('email', dto.email);
    else if (dto.phone) query = query.eq('phone', dto.phone);
    else throw new Error('Email or phone is required');

    const { data: user } = await query.single();
    if (!user) throw new Error('Invalid credentials');

    const { data: pwData } = await supabase
      .from('user_passwords').select('password_hash').eq('user_id', user.id).single();
    if (!pwData) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, pwData.password_hash);
    if (!valid) throw new Error('Invalid credentials');

    const { data: profile } = await supabase
      .from('customers').select('*').eq('user_id', user.id).single();

    const token = signToken({
      userId: user.id, email: user.email, phone: user.phone,
      role: 'customer', name: user.name,
    });
    return {
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: 'customer' },
      profile,
      token,
    };
  },

  async getProfile(userId: string) {
    const { data: user } = await supabase
      .from('users').select('id, name, email, phone, is_active, created_at')
      .eq('id', userId).single();
    if (!user) throw new Error('User not found');

    const { data: profile } = await supabase
      .from('customers').select('*').eq('user_id', userId).single();

    const { data: addresses } = await supabase
      .from('customer_addresses').select('*').eq('customer_id', userId).order('is_default', { ascending: false });

    return { ...user, profile, addresses: addresses || [] };
  },

  async updateProfile(userId: string, dto: { name?: string; avatar_url?: string; date_of_birth?: string; gender?: string }) {
    if (dto.name) {
      await supabase.from('users').update({ name: dto.name }).eq('id', userId);
    }

    const profileUpdate: any = {};
    if (dto.avatar_url) profileUpdate.avatar_url = dto.avatar_url;
    if (dto.date_of_birth) profileUpdate.date_of_birth = dto.date_of_birth;
    if (dto.gender) profileUpdate.gender = dto.gender;
    profileUpdate.updated_at = new Date().toISOString();

    if (Object.keys(profileUpdate).length > 1) {
      await supabase.from('customers').update(profileUpdate).eq('user_id', userId);
    }

    return this.getProfile(userId);
  },

  // Address management
  async addAddress(userId: string, dto: {
    label?: string; full_name: string; phone: string;
    address_line1: string; address_line2?: string;
    city: string; state: string; pincode: string;
    latitude?: number; longitude?: number; is_default?: boolean;
  }) {
    if (dto.is_default) {
      await supabase.from('customer_addresses')
        .update({ is_default: false }).eq('customer_id', userId);
    }

    const { data, error } = await supabase.from('customer_addresses')
      .insert({ customer_id: userId, ...dto })
      .select().single();
    if (error) throw new Error(error.message);

    if (dto.is_default && data) {
      await supabase.from('customers')
        .update({ default_address_id: data.id }).eq('user_id', userId);
    }

    return data;
  },

  async updateAddress(userId: string, addressId: string, dto: any) {
    if (dto.is_default) {
      await supabase.from('customer_addresses')
        .update({ is_default: false }).eq('customer_id', userId);
    }

    const { data, error } = await supabase.from('customer_addresses')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', addressId).eq('customer_id', userId)
      .select().single();
    if (error) throw new Error(error.message);

    if (dto.is_default && data) {
      await supabase.from('customers')
        .update({ default_address_id: data.id }).eq('user_id', userId);
    }

    return data;
  },

  async deleteAddress(userId: string, addressId: string) {
    const { error } = await supabase.from('customer_addresses')
      .delete().eq('id', addressId).eq('customer_id', userId);
    if (error) throw new Error(error.message);
    return { deleted: true };
  },

  async getAddresses(userId: string) {
    const { data } = await supabase.from('customer_addresses')
      .select('*').eq('customer_id', userId)
      .order('is_default', { ascending: false });
    return data || [];
  },
};
