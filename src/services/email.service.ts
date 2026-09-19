import nodemailer from 'nodemailer';
import dns from 'dns';

// Force IPv4 resolution to prevent ENETUNREACH on IPv6 networks
dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  family: 4,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const emailService = {
  async sendResetOtp(email: string, otp: string) {
    try {
      const mailOptions = {
        from: `"Teksys Agro" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: 'Password Reset Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2e7d32;">Password Reset Request</h2>
            <p>You requested a password reset for your Teksys Agro account.</p>
            <p>Your verification code is: <strong><span style="font-size: 24px; letter-spacing: 2px;">${otp}</span></strong></p>
            <p>This code will expire in 15 minutes.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #777;">If you did not request this, please ignore this email.</p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email. Please try again later.');
    }
  }
};
