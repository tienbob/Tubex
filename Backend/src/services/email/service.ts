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

interface LoginDetails {
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
  location?: string;
}

export const sendLoginNotificationEmail = async (to: string, loginTime: Date, loginDetails?: LoginDetails) => {
  // Format user agent to be more readable
  let deviceInfo = 'Unknown device';
  if (loginDetails?.userAgent) {
    if (loginDetails.userAgent.includes('Mobile')) {
      deviceInfo = loginDetails.userAgent.includes('iPhone') ? 'iPhone' : 
                   loginDetails.userAgent.includes('Android') ? 'Android device' : 'Mobile device';
    } else {
      deviceInfo = loginDetails.userAgent.includes('Windows') ? 'Windows computer' :
                   loginDetails.userAgent.includes('Mac') ? 'Mac computer' :
                   loginDetails.userAgent.includes('Linux') ? 'Linux computer' : 'Desktop computer';
    }
  }

  const html = `
    <h1>New Login Detected</h1>
    <p>We detected a new login to your Tubex account:</p>
    <p>Time: ${loginTime.toLocaleString()}</p>
    ${loginDetails?.ipAddress ? `<p>IP Address: ${loginDetails.ipAddress}</p>` : ''}
    ${deviceInfo ? `<p>Device: ${deviceInfo}</p>` : ''}
    ${loginDetails?.location ? `<p>Location: ${loginDetails.location}</p>` : ''}
    <p>If this wasn't you, please change your password immediately and contact our support team.</p>
    <p>For security, we recommend:</p>
    <ul>
      <li>Using a strong, unique password</li>
      <li>Enabling two-factor authentication when available</li>
      <li>Logging out when using shared devices</li>
    </ul>
  `;

  await sendEmail({
    to,
    subject: 'Security Alert: New Login to Your Account',
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

export const sendCompanyApprovalNotification = async (to: string, companyName: string): Promise<void> => {
  const html = `
    <h1>Company Registration Approved</h1>
    <p>Great news! Your company <strong>${companyName}</strong> has been verified and approved.</p>
    <p>Your company account is now active, and you can start using all features of the Tubex platform.</p>
    <p>Next steps:</p>
    <ul>
      <li>Set up your company profile</li>
      <li>Invite team members using invitation codes</li>
      <li>Explore the platform features</li>
    </ul>
    <p>If you have any questions or need assistance, please contact our support team.</p>
    <p>Thank you for choosing Tubex for your business needs!</p>
    <p>Best regards,<br/>The Tubex Team</p>
  `;

  await sendEmail({
    to,
    subject: `Company Registration Approved: ${companyName}`,
    html
  });
};

export const sendCompanyRejectionNotification = async (to: string, companyName: string, reason: string): Promise<void> => {
  const html = `
    <h1>Company Registration Status Update</h1>
    <p>We've reviewed your company registration for <strong>${companyName}</strong>.</p>
    <p>Unfortunately, we're unable to approve the registration at this time.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>You can address the issues mentioned and submit a new registration, or contact our support team for assistance.</p>
    <p>If you believe this decision was made in error, please respond to this email with any additional information that might help us reconsider.</p>
    <p>Thank you for your interest in Tubex.</p>
    <p>Best regards,<br/>The Tubex Support Team</p>
  `;

  await sendEmail({
    to,
    subject: `Company Registration Update: ${companyName}`,
    html
  });
};