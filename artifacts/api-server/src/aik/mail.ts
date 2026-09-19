/**
 * Account email for the Hub — address confirmation and password reset.
 *
 * Reuses the site's existing Gmail transporter (GMAIL_USER /
 * GMAIL_APP_PASSWORD), so no new service and no new credential.
 *
 * Two rules hold throughout:
 *   - Links carry a one-time token that is stored only as a SHA-256 hash.
 *   - Nothing here ever reveals whether an address has an account. The
 *     caller answers "check your email" either way; this module is simply
 *     not called when there is no account.
 */
import { getTransporter, isEmailConfigured, FROM_EMAIL } from "../email";
import { logger } from "../lib/logger";
import { aikConfig } from "./config";

const BRAND = "Humanity + AI";

function shell(heading: string, body: string): string {
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
    <div style="background:linear-gradient(135deg,#5b21b6 0%,#7c3aed 100%);padding:32px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">${heading}</h1>
    </div>
    <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
      ${body}
      <p style="font-size:14px;color:#6b7280;margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;">— The ${BRAND} team</p>
    </div>
  </div>`;
}

function button(href: string, label: string): string {
  return `<p style="text-align:center;margin:32px 0;">
    <a href="${href}" style="background:#7c3aed;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">${label}</a>
  </p>
  <p style="font-size:14px;line-height:1.6;color:#6b7280;">If the button doesn't work, paste this into your browser:<br/>
    <a href="${href}" style="color:#7c3aed;word-break:break-all;">${href}</a></p>`;
}

async function send(to: string, subject: string, html: string, linkForLog: string): Promise<{ sent: boolean }> {
  const transporter = getTransporter();
  if (!transporter || !isEmailConfigured()) {
    // Without a mail service the account would be unreachable, so put the
    // link where an operator can retrieve it rather than losing it.
    logger.warn({ to, link: linkForLog }, "[aik] email not configured — link logged instead of sent");
    return { sent: false };
  }
  try {
    await transporter.sendMail({ from: `"${BRAND}" <${FROM_EMAIL}>`, to, subject, html });
    logger.info({ to, subject }, "[aik] account email sent");
    return { sent: true };
  } catch (err) {
    logger.error({ err, to }, "[aik] account email failed");
    return { sent: false };
  }
}

export function verifyUrl(token: string): string {
  return `${aikConfig.publicUrl}/aiforkids/hub?verify=${encodeURIComponent(token)}`;
}

export function resetUrl(token: string): string {
  return `${aikConfig.publicUrl}/aiforkids/hub?reset=${encodeURIComponent(token)}`;
}

export async function sendVerification(to: string, displayName: string, token: string): Promise<{ sent: boolean }> {
  const url = verifyUrl(token);
  const first = displayName.trim().split(/\s+/)[0] || "there";
  return send(
    to,
    `Confirm your ${BRAND} account`,
    shell(
      "Confirm your email",
      `<p style="font-size:16px;line-height:1.6;">Hi ${first},</p>
       <p style="font-size:16px;line-height:1.6;">Welcome to the ${BRAND} Hub. Confirm this address and you're in. The link works for 24 hours.</p>
       ${button(url, "Confirm my email")}
       <p style="font-size:14px;line-height:1.6;color:#6b7280;">Your account starts with its own private workspace and the AI tools. Running a class with children needs separate approval from a ${BRAND} admin.</p>
       <p style="font-size:14px;line-height:1.6;color:#6b7280;">If you didn't create this account, ignore this email and nothing happens.</p>`,
    ),
    url,
  );
}

export async function sendReset(to: string, displayName: string, token: string): Promise<{ sent: boolean }> {
  const url = resetUrl(token);
  const first = displayName.trim().split(/\s+/)[0] || "there";
  return send(
    to,
    `Reset your ${BRAND} password`,
    shell(
      "Reset your password",
      `<p style="font-size:16px;line-height:1.6;">Hi ${first},</p>
       <p style="font-size:16px;line-height:1.6;">Someone asked to reset the password on this account. Choose a new one with the link below — it works once, and expires in an hour.</p>
       ${button(url, "Choose a new password")}
       <p style="font-size:14px;line-height:1.6;color:#6b7280;">If this wasn't you, ignore this email. Your password stays as it is, and the link expires on its own.</p>`,
    ),
    url,
  );
}
