import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { AppError } from '../../middleware/errorHandler';
import { config } from '../../config';
import { Company } from '../../database/models/sql/company';

// Development mode check
const isDevelopment = config.nodeEnv === 'development';
let sesClient: SESClient | null = null;

// Only initialize AWS SES if credentials are available or we're in production
if ((config.aws.accessKeyId && config.aws.secretAccessKey) || !isDevelopment) {
  if (!config.aws.accessKeyId || !config.aws.secretAccessKey) {
    throw new Error('AWS credentials are not configured in production mode');
  }
  
  sesClient = new SESClient({
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey
    }
  });
} else {
  console.log('AWS credentials not found, using mock email service in development mode');
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  const { to, subject, html, from = config.email.defaultFrom } = options;

  // In development mode with no AWS credentials, log the email instead of sending
  if (!sesClient) {
    console.log('----------------------');
    console.log('MOCK EMAIL SERVICE (Development Mode)');
    console.log('From:', from);
    console.log('To:', Array.isArray(to) ? to.join(', ') : to);
    console.log('Subject:', subject);
    console.log('Body:', html);
    console.log('----------------------');
    return;
  }

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

export const sendUserStatusChangeEmail = async (
  to: string,
  newStatus: string,
  reason: string
) => {
  const subject = `Your Account Status Has Been Updated`;
  const html = `
    <h1>Account Status Update</h1>
    <p>Your account status has been updated to: <strong>${newStatus}</strong></p>
    <p>Reason provided: ${reason}</p>
    ${newStatus === 'inactive' ? `
    <p style="color: #d32f2f;">Your access to the system has been suspended. 
    Please contact your company administrator for more information.</p>
    ` : `
    <p style="color: #2e7d32;">Your account is now active. 
    You can log in to access the system.</p>
    `}
    <p>If you believe this change was made in error, please contact your company administrator.</p>
  `;

  await sendEmail({
    to,
    subject,
    html
  });
};

export const sendVerificationNotification = async (company: Company): Promise<void> => {
    // TODO: Implement actual email sending logic
    console.log(`Sending verification notification for company ${company.name}. Status: ${company.status}`);
};