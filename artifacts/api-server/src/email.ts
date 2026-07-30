import nodemailer from "nodemailer";
import type { Event, EventSignup } from "@workspace/db";

export const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
export const FROM_EMAIL = "danielle@humanityplusai.org";
// Organiser notifications go to EVERY address listed here.
// EVENT_ADMIN_EMAIL accepts a comma-separated list.
const ADMIN_EMAILS = (process.env.EVENT_ADMIN_EMAIL || "danielle@humanityplusai.org,danielle@techleadershipcommunity.com")
  .split(",")
  .map((a) => a.trim())
  .filter(Boolean);

// A SINGLE address. newsletter.ts feeds this to personalize(), which bakes
// the recipient into an unsubscribe token, so it must never be a list.
export const ADMIN_EMAIL = ADMIN_EMAILS[0] || "danielle@humanityplusai.org";

// The full list, for `to:` fields. nodemailer accepts a comma-separated
// string, so one constant fans a notification out to every organiser.
export const ADMIN_NOTIFY = ADMIN_EMAILS.join(", ");

let transporter: nodemailer.Transporter | null = null;

if (GMAIL_USER && GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
  console.log("[email] Gmail transporter configured successfully.");
} else {
  console.warn("[email] GMAIL_USER or GMAIL_APP_PASSWORD not set — emails will not be sent.");
}

export function isEmailConfigured(): boolean {
  return transporter !== null;
}

/** Shared Gmail transporter, or null when credentials aren't configured. */
export function getTransporter(): nodemailer.Transporter | null {
  return transporter;
}

export async function sendEventSignupEmails(signup: EventSignup, event: Event): Promise<{ sent: boolean; reason?: string }> {
  if (!transporter) {
    console.warn("[email] Gmail not configured — signup recorded but no email sent.");
    return { sent: false, reason: "Email service not configured" };
  }

  const eventDate = new Date(event.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const attendeeHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">You're confirmed for ${event.title}</h1>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; line-height: 1.6;">Hi ${signup.fullName},</p>
        <p style="font-size: 16px; line-height: 1.6;">Thank you for signing up for <strong>${event.title}</strong> with Humanity + AI, Inc. We're looking forward to having you join us.</p>
        <div style="background: #f9fafb; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${eventDate}</p>
          <p style="margin: 0 0 8px 0;"><strong>Time:</strong> ${event.time}</p>
          <p style="margin: 0 0 8px 0;"><strong>Location:</strong> ${event.location}</p>
          ${event.link ? `<p style="margin: 16px 0 0 0;"><a href="${event.link}" style="background: #3b82f6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 600;">Join the Event</a></p>` : ""}
        </div>
        <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">${event.description}</p>
        <p style="font-size: 14px; color: #6b7280; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          If you have questions, reply to this email or contact us at <a href="mailto:${FROM_EMAIL}" style="color: #3b82f6;">${FROM_EMAIL}</a>.
        </p>
        <p style="font-size: 14px; color: #6b7280;">— The Humanity + AI, Inc. Team</p>
      </div>
    </div>
  `;

  const adminHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; color: #1a1a1a;">
      <h2 style="color: #1e3a8a;">New Event Signup</h2>
      <p><strong>Event:</strong> ${event.title}</p>
      <p><strong>Date:</strong> ${eventDate} · ${event.time}</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
      <p><strong>Name:</strong> ${signup.fullName}</p>
      <p><strong>Email:</strong> <a href="mailto:${signup.email}">${signup.email}</a></p>
      ${signup.organization ? `<p><strong>Organization:</strong> ${signup.organization}</p>` : ""}
      ${signup.notes ? `<p><strong>Notes:</strong><br/>${signup.notes.replace(/\n/g, "<br/>")}</p>` : ""}
    </div>
  `;

  try {
    await Promise.all([
      transporter.sendMail({
        from: `"Humanity + AI, Inc." <${GMAIL_USER}>`,
        replyTo: FROM_EMAIL,
        to: signup.email,
        subject: `You're confirmed: ${event.title}`,
        html: attendeeHtml,
      }),
      transporter.sendMail({
        from: `"Humanity + AI Events" <${GMAIL_USER}>`,
        replyTo: signup.email,
        to: ADMIN_NOTIFY,
        subject: `New signup: ${signup.fullName} — ${event.title}`,
        html: adminHtml,
      }),
    ]);
    console.log(`[email] Signup emails sent for ${signup.fullName} → ${event.title}`);
    return { sent: true };
  } catch (err: any) {
    console.error("[email] Failed to send signup emails:", err?.message || err);
    return { sent: false, reason: err?.message || "Email delivery failed" };
  }
}

export async function sendNewsletterNotification(email: string): Promise<{ sent: boolean; reason?: string }> {
  if (!transporter) {
    console.warn("[email] Gmail not configured — newsletter signup not emailed.");
    return { sent: false, reason: "Email service not configured" };
  }

  const subscriberHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to the Humanity + AI Newsletter</h1>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; line-height: 1.6;">Thank you for subscribing to the Humanity + AI, Inc. newsletter!</p>
        <p style="font-size: 16px; line-height: 1.6;">You'll receive updates on our latest events, programs, blog posts, and community initiatives at the intersection of humanity and artificial intelligence.</p>
        <p style="font-size: 14px; color: #6b7280; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          Questions? Reach us at <a href="mailto:${FROM_EMAIL}" style="color: #3b82f6;">${FROM_EMAIL}</a>.
        </p>
        <p style="font-size: 14px; color: #6b7280;">— The Humanity + AI, Inc. Team</p>
      </div>
    </div>
  `;

  const adminHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; color: #1a1a1a;">
      <h2 style="color: #1e3a8a;">New Newsletter Subscriber</h2>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p style="font-size: 13px; color: #6b7280;">Subscribed at ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET</p>
    </div>
  `;

  try {
    await Promise.all([
      transporter.sendMail({
        from: `"Humanity + AI, Inc." <${GMAIL_USER}>`,
        replyTo: FROM_EMAIL,
        to: email,
        subject: "Welcome to the Humanity + AI Newsletter",
        html: subscriberHtml,
      }),
      transporter.sendMail({
        from: `"Humanity + AI Newsletter" <${GMAIL_USER}>`,
        replyTo: email,
        to: ADMIN_NOTIFY,
        subject: `New subscriber: ${email}`,
        html: adminHtml,
      }),
    ]);
    console.log(`[email] Newsletter emails sent for ${email}`);
    return { sent: true };
  } catch (err: any) {
    console.error("[email] Failed to send newsletter emails:", err?.message || err);
    return { sent: false, reason: err?.message || "Email delivery failed" };
  }
}

export async function sendNewAccountNotification(username: string, email: string | null, fullName: string | null): Promise<{ sent: boolean; reason?: string }> {
  if (!transporter) {
    console.warn("[email] Gmail not configured — account creation not emailed.");
    return { sent: false, reason: "Email service not configured" };
  }

  const welcomeHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Humanity + AI</h1>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; line-height: 1.6;">Hi${fullName ? ` ${fullName.split(" ")[0]}` : ""},</p>
        <p style="font-size: 16px; line-height: 1.6;">Your Humanity + AI, Inc. account has been created. You can now sign up for events, join discussions, and stay connected with our community.</p>
        <p style="font-size: 14px; color: #6b7280; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          Questions? Reach us at <a href="mailto:${FROM_EMAIL}" style="color: #3b82f6;">${FROM_EMAIL}</a>.
        </p>
        <p style="font-size: 14px; color: #6b7280;">— The Humanity + AI, Inc. Team</p>
      </div>
    </div>
  `;

  const adminHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; color: #1a1a1a;">
      <h2 style="color: #1e3a8a;">New Account Created</h2>
      <p><strong>Username:</strong> ${username}</p>
      ${fullName ? `<p><strong>Full Name:</strong> ${fullName}</p>` : ""}
      ${email ? `<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>` : ""}
      <p style="font-size: 13px; color: #6b7280;">Registered at ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET</p>
    </div>
  `;

  try {
    const sends = [
      transporter.sendMail({
        from: `"Humanity + AI Accounts" <${GMAIL_USER}>`,
        to: ADMIN_NOTIFY,
        subject: `New account: ${fullName || username}`,
        html: adminHtml,
      }),
    ];
    if (email) {
      sends.push(
        transporter.sendMail({
          from: `"Humanity + AI, Inc." <${GMAIL_USER}>`,
          replyTo: FROM_EMAIL,
          to: email,
          subject: "Welcome to Humanity + AI",
          html: welcomeHtml,
        }),
      );
    }
    await Promise.all(sends);
    console.log(`[email] Account notification sent for ${username}`);
    return { sent: true };
  } catch (err: any) {
    console.error("[email] Failed to send account notification:", err?.message || err);
    return { sent: false, reason: err?.message || "Email delivery failed" };
  }
}

export async function sendDonationNotification(amount: number, donorName: string | null, donorEmail: string | null, message: string | null): Promise<{ sent: boolean; reason?: string }> {
  if (!transporter) {
    console.warn("[email] Gmail not configured — donation notification not emailed.");
    return { sent: false, reason: "Email service not configured" };
  }

  const formattedAmount = `$${(amount / 100).toFixed(2)}`;

  const donorHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Thank You for Your Donation</h1>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; line-height: 1.6;">Hi${donorName ? ` ${donorName.split(" ")[0]}` : ""},</p>
        <p style="font-size: 16px; line-height: 1.6;">Thank you for your generous donation of <strong>${formattedAmount}</strong> to Humanity + AI, Inc. Your support helps us continue our mission of bridging the gap between humanity and AI through ethical development, education, and community building.</p>
        <p style="font-size: 14px; color: #6b7280; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          This email serves as your donation receipt. If you have questions, contact us at <a href="mailto:${FROM_EMAIL}" style="color: #3b82f6;">${FROM_EMAIL}</a>.
        </p>
        <p style="font-size: 14px; color: #6b7280;">— The Humanity + AI, Inc. Team</p>
      </div>
    </div>
  `;

  const adminHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; color: #1a1a1a;">
      <h2 style="color: #1e3a8a;">New Donation Received</h2>
      <p><strong>Amount:</strong> ${formattedAmount}</p>
      ${donorName ? `<p><strong>Donor:</strong> ${donorName}</p>` : ""}
      ${donorEmail ? `<p><strong>Email:</strong> <a href="mailto:${donorEmail}">${donorEmail}</a></p>` : ""}
      ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
      <p style="font-size: 13px; color: #6b7280;">Received at ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET</p>
    </div>
  `;

  try {
    const sends = [
      transporter.sendMail({
        from: `"Humanity + AI Donations" <${GMAIL_USER}>`,
        to: ADMIN_NOTIFY,
        subject: `New donation: ${formattedAmount}${donorName ? ` from ${donorName}` : ""}`,
        html: adminHtml,
      }),
    ];
    if (donorEmail) {
      sends.push(
        transporter.sendMail({
          from: `"Humanity + AI, Inc." <${GMAIL_USER}>`,
          replyTo: FROM_EMAIL,
          to: donorEmail,
          subject: `Thank you for your donation — Humanity + AI, Inc.`,
          html: donorHtml,
        }),
      );
    }
    await Promise.all(sends);
    console.log(`[email] Donation notification sent: ${formattedAmount}`);
    return { sent: true };
  } catch (err: any) {
    console.error("[email] Failed to send donation notification:", err?.message || err);
    return { sent: false, reason: err?.message || "Email delivery failed" };
  }
}

export async function sendPasswordResetEmail(
  toEmail: string,
  fullName: string | null,
  resetUrl: string,
): Promise<{ sent: boolean; reason?: string }> {
  if (!transporter) {
    console.warn("[email] Gmail not configured — password reset email not sent.");
    console.warn(`[email] Reset link for ${toEmail}: ${resetUrl}`);
    return { sent: false, reason: "Email service not configured" };
  }

  const greeting = fullName ? `Hi ${fullName.split(" ")[0]},` : "Hi,";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Reset your password</h1>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; line-height: 1.6;">${greeting}</p>
        <p style="font-size: 16px; line-height: 1.6;">We received a request to reset the password for your Humanity + AI, Inc. account. Click the button below to set a new password. This link will expire in 1 hour.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #3b82f6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 600;">Reset Password</a>
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a></p>
        <p style="font-size: 14px; color: #6b7280; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          If you didn't request this, you can safely ignore this email — your password will not change.
        </p>
        <p style="font-size: 14px; color: #6b7280;">— The Humanity + AI, Inc. Team</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Humanity + AI, Inc." <${GMAIL_USER}>`,
      replyTo: FROM_EMAIL,
      to: toEmail,
      subject: "Reset your Humanity + AI password",
      html,
    });
    return { sent: true };
  } catch (err: any) {
    console.error("[email] Failed to send password reset email:", err?.message || err);
    return { sent: false, reason: err?.message || "Email delivery failed" };
  }
}
