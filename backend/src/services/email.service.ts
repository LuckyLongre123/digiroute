import logger from '../utils/logger.js';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  logger.info({ to: options.to, subject: options.subject }, 'Sending email');
  // TODO: Integrate an email provider (Nodemailer, Resend, SendGrid, etc.)
  // Example:
  // await transporter.sendMail({ from: process.env.EMAIL_FROM, ...options });
};

export const sendWelcomeEmail = async (to: string, name: string): Promise<void> => {
  await sendEmail({
    to,
    subject: 'Welcome!',
    html: `<p>Hi ${name}, welcome aboard!</p>`,
  });
};

export const sendPasswordResetEmail = async (to: string, resetToken: string): Promise<void> => {
  await sendEmail({
    to,
    subject: 'Password Reset Request',
    html: `<p>Your reset token: <strong>${resetToken}</strong></p>`,
  });
};
