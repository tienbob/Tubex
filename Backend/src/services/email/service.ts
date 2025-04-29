import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { AppError } from '../../middleware/errorHandler';
import { config } from '../../config';

if (!config.aws.accessKeyId || !config.aws.secretAccessKey) {
  throw new Error('AWS credentials are not configured');
}

const sesClient = new SESClient({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
  }
});

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  const { to, subject, html, from = config.email.defaultFrom } = options;

  const command = new SendEmailCommand({
    Source: from,
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to]
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8'
      },
      Body: {
        Html: {
          Data: html,
          Charset: 'UTF-8'
        }
      }
    }
  });

  try {
    await sesClient.send(command);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new AppError(500, 'Failed to send email');
  }
};

export const sendPasswordResetEmail = async (to: string, resetToken: string) => {
  const resetUrl = `${config.frontend.url}/reset-password?token=${resetToken}`;
  
  const html = `
    <h1>Password Reset Request</h1>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>If you didn't request this, please ignore this email.</p>
    <p>This link will expire in 1 hour.</p>
  `;

  await sendEmail({
    to,
    subject: 'Password Reset Request',
    html
  });
};

export const sendWelcomeEmail = async (to: string, userName: string) => {
  const html = `
    <h1>Welcome to Tubex!</h1>
    <p>Dear ${userName},</p>
    <p>Thank you for joining Tubex. We're excited to have you on board!</p>
    <p>If you have any questions, feel free to reach out to our support team.</p>
    <p>Best regards,<br/>The Tubex Team</p>
  `;

  await sendEmail({
    to,
    subject: 'Welcome to Tubex',
    html
  });
};

export const sendVerificationEmail = async (to: string, verificationToken: string) => {
  const verificationUrl = `${config.frontend.url}/verify-email?token=${verificationToken}`;
  
  const html = `
    <h1>Verify Your Email</h1>
    <p>Please click the link below to verify your email address:</p>
    <a href="${verificationUrl}">Verify Email</a>
    <p>If you didn't create an account with us, please ignore this email.</p>
    <p>This link will expire in 24 hours.</p>
  `;

  await sendEmail({
    to,
    subject: 'Verify Your Email Address',
    html
  });
};

export const sendLoginNotificationEmail = async (to: string, loginTime: Date, location?: string) => {
  const html = `
    <h1>New Login Detected</h1>
    <p>We detected a new login to your Tubex account:</p>
    <p>Time: ${loginTime.toLocaleString()}</p>
    ${location ? `<p>Location: ${location}</p>` : ''}
    <p>If this wasn't you, please change your password immediately and contact our support team.</p>
  `;

  await sendEmail({
    to,
    subject: 'New Login to Your Account',
    html
  });
};