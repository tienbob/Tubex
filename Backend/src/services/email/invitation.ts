import { sendEmail } from './service';
import { config } from '../../config';

export const sendInvitationEmail = async (to: string, code: string, role: string, message: string, companyId: string) => {
  const invitationUrl = `${config.frontend.url}/register?invitationCode=${code}&companyId=${companyId}`;
  const html = `
    <h1>You're Invited to Join Tubex</h1>
    <p>${message || 'You have been invited to join Tubex.'}</p>
    <p><strong>Role:</strong> ${role}</p>
    <p>Your invitation code: <b>${code}</b></p>
    <p>Click the link below to accept the invitation and register:</p>
    <a href="${invitationUrl}">${invitationUrl}</a>
    <p>If you did not expect this invitation, you can ignore this email.</p>
    <p>Best regards,<br/>The Tubex Team</p>
  `;
  await sendEmail({
    to,
    subject: 'Tubex Invitation',
    html
  });
};
