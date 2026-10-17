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

/**
 * A child said something worrying in a chat. The facilitator is the person
 * who can actually help, so they hear about it at once. No links, no child
 * names (the Studio never has them): the class, the module and the words.
 */
export async function sendCareAlert(to: string, info: { className: string; childId: number | null; mode: string; message: string }): Promise<{ sent: boolean }> {
  const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#111827;">
    <h2 style="color:#b91c1c;">A child in ${esc(info.className)} may need you</h2>
    <p style="font-size:15px;line-height:1.6;">In the <b>${esc(info.mode)}</b> helper, a child (studio id ${info.childId ?? "unknown"}) wrote:</p>
    <blockquote style="border-left:4px solid #b91c1c;margin:16px 0;padding:8px 16px;background:#fef2f2;font-size:15px;">${esc(info.message)}</blockquote>
    <p style="font-size:15px;line-height:1.6;">The helper replied with a kind, scripted message and asked them to talk to you or another trusted adult. Please check in with them now. The class feed shows which request this was.</p>
  </div>`;
  return send(to, `${BRAND}: a child in ${info.className} may need you`, html, "care-alert");
}

/* ------------------------------------------------------------------ *
 * Remix workflow: "Save project" sends the work to the participant
 * ------------------------------------------------------------------ */

export type ProjectPiece = { title: string; kind: string; description: string; madeFrom: string | null; attached: string[]; tooBig: string[] };
export type ProjectAttachment = { filename: string; content: Buffer; contentType: string };

const escHtml = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

export async function sendProjectEmail(v: {
  to: string;
  cc: string[];
  replyTo: string | null;
  participantName: string | null;
  facilitatorName: string;
  projectName: string;
  note: string;
  pieces: ProjectPiece[];
  attachments: ProjectAttachment[];
  hubUrl: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const transporter = getTransporter();
  if (!transporter || !isEmailConfigured()) {
    logger.warn({ to: v.to, project: v.projectName }, "[aik] project email not sent: mail is not configured on this app");
    return { sent: false, reason: "Email isn't set up on the kids app yet (GMAIL_USER and GMAIL_APP_PASSWORD)." };
  }
  const first = (v.participantName ?? "").trim().split(/\s+/)[0] || "there";
  const list = v.pieces
    .map(
      (p) => `<li style="margin:0 0 14px;">
        <b>${escHtml(p.title)}</b> <span style="color:#6b7280;">(${escHtml(p.kind)}${p.madeFrom ? `, remixed from ${escHtml(p.madeFrom)}` : ""})</span><br/>
        <span style="color:#374151;">${escHtml(p.description)}</span>
        ${p.attached.length ? `<br/><span style="color:#059669;font-size:13px;">Attached: ${escHtml(p.attached.join(", "))}</span>` : ""}
        ${p.tooBig.length ? `<br/><span style="color:#b45309;font-size:13px;">Too large to attach (ask your facilitator for a copy): ${escHtml(p.tooBig.join(", "))}</span>` : ""}
      </li>`,
    )
    .join("");
  const html = shell(
    escHtml(v.projectName),
    `<p style="font-size:16px;line-height:1.6;">Hi ${escHtml(first)},</p>
     <p style="font-size:16px;line-height:1.6;">Here is everything made in <b>${escHtml(v.projectName)}</b> with ${escHtml(v.facilitatorName)} at ${BRAND}.</p>
     ${v.note ? `<blockquote style="border-left:4px solid #7c3aed;margin:16px 0;padding:8px 16px;background:#f5f3ff;font-size:15px;">${escHtml(v.note)}</blockquote>` : ""}
     <ul style="padding-left:20px;font-size:15px;line-height:1.5;">${list}</ul>
     <p style="font-size:14px;line-height:1.6;color:#6b7280;">Games open in any web browser. Picture books are PDFs. Songs and read-alouds are MP3s, movies are MP4s.</p>
     <p style="font-size:14px;line-height:1.6;color:#6b7280;">Facilitators can open the full project in the Hub: <a href="${v.hubUrl}" style="color:#7c3aed;">${v.hubUrl}</a></p>`,
  );
  try {
    await transporter.sendMail({
      from: `"${BRAND}" <${FROM_EMAIL}>`,
      to: v.to,
      cc: v.cc,
      replyTo: v.replyTo ?? undefined,
      subject: `${BRAND}: ${v.projectName}`,
      html,
      attachments: v.attachments,
    });
    logger.info({ to: v.to, cc: v.cc, project: v.projectName, files: v.attachments.length }, "[aik] project email sent");
    return { sent: true };
  } catch (err) {
    logger.error({ err, to: v.to }, "[aik] project email failed");
    return { sent: false, reason: "The email service refused the message. Try again, or send fewer files." };
  }
}
