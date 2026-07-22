import { supabase } from '../config/supabase';

export const otpService = {
  async generateAndSend(pickupId: string, phone: string): Promise<string> {
    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store it in the database
    const { error } = await supabase
      .from('pickup_requests')
      .update({ otp })
      .eq('id', pickupId);

    if (error) {
      console.error('Error saving OTP to DB:', error);
      throw new Error('Could not generate OTP');
    }
    
    // In a real application, you would integrate an SMS provider like Twilio here.
    console.log(`[OTP SERVICE] Generated OTP ${otp} for Pickup ${pickupId} (Phone: ${phone})`);
    
    return otp;
  },

  async verify(pickupId: string, otpInput: string): Promise<boolean> {
    const { data: pickup, error } = await supabase
      .from('pickup_requests')
      .select('otp')
      .eq('id', pickupId)
      .single();

    if (error || !pickup) {
      throw new Error('OTP expired or pickup not found');
    }

    if (!pickup.otp) {
      throw new Error('No OTP generated for this pickup');
    }

    if (pickup.otp !== otpInput) {
      throw new Error('Invalid OTP. Please try again.');
    }

    // Clear the OTP once verified to prevent reuse
    await supabase
      .from('pickup_requests')
      .update({ otp: null })
      .eq('id', pickupId);

    return true;
  }
};

