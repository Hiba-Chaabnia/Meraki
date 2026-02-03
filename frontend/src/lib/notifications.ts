import type { NotificationPrefs } from "@/types/database.types";

export type NotificationKind = keyof NotificationPrefs & (
  | "streak_reminders"
  | "challenge_alerts"
  | "weekly_digest"
);

interface NotificationEmail {
  to: string;
  kind: NotificationKind;
  subject: string;
  body: string;
}

/**
 * TODO: no email provider is wired up yet (this app has no SMTP/Resend/SendGrid
 * integration). This stub exists so notification preferences are structurally
 * ready — callers can start triggering on real events today — without a
 * fake/misleading "email sent" claim. Swap the body for a real provider call
 * once one is chosen, respecting `email_enabled` + the specific `kind` toggle
 * in the recipient's `notification_prefs` before sending.
 */
export async function sendNotificationEmail(email: NotificationEmail): Promise<{ sent: boolean }> {
  console.log(`[notifications] STUB — would send "${email.kind}" to ${email.to}: ${email.subject}`);
  return { sent: false };
}
