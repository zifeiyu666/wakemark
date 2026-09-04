'use server';

import { sendEmail } from '@/actions/resend';
import { FeedbackAdminEmail } from '@/emails/feedback-admin';
import { actionResponse, ActionResult } from '@/lib/action-response';
import { getSession } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { feedbacks } from '@/lib/db/schema';
import { sendDiscordNotification } from '@/lib/discord/notifications';
import { getErrorMessage } from '@/lib/error-utils';
import {
  FEEDBACK_MESSAGE_MAX_LENGTH,
  FEEDBACK_TITLE_MAX_LENGTH,
} from '@/lib/validations';
import { z } from 'zod';

const submitFeedbackSchema = z.object({
  category: z.enum(['bug', 'feature', 'question']),
  title: z.string().trim().min(1).max(FEEDBACK_TITLE_MAX_LENGTH),
  message: z.string().trim().min(1).max(FEEDBACK_MESSAGE_MAX_LENGTH),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;

export const submitFeedback = async (
  input: SubmitFeedbackInput
): Promise<ActionResult<{ id: string }>> => {
  const session = await getSession();
  if (!session?.user?.id) {
    return actionResponse.unauthorized();
  }

  const parsed = submitFeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return actionResponse.badRequest(
      parsed.error.issues[0]?.message ?? 'Invalid feedback payload.'
    );
  }

  try {
    const [created] = await db
      .insert(feedbacks)
      .values({
        userId: session.user.id,
        category: parsed.data.category,
        title: parsed.data.title,
        message: parsed.data.message,
      })
      .returning({ id: feedbacks.id });

    try {
      await notifyFeedbackSubmitted({
        category: parsed.data.category,
        title: parsed.data.title,
        message: parsed.data.message,
        fromEmail: session.user.email ?? 'unknown',
        fromName: session.user.name,
      });
    } catch (error) {
      console.error('Failed to notify feedback submission:', error);
    }

    return actionResponse.success({ id: created.id });
  } catch (error) {
    return actionResponse.error(getErrorMessage(error));
  }
};

async function notifyFeedbackSubmitted({
  category,
  title,
  message,
  fromEmail,
  fromName,
}: {
  category: SubmitFeedbackInput['category'];
  title: string;
  message: string;
  fromEmail: string;
  fromName?: string | null;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wakemark.app';
  const inboxUrl = `${siteUrl}/dashboard/feedbacks`;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM_ADDRESS;

  const tasks: Promise<unknown>[] = [];

  if (process.env.DISCORD_WEBHOOK_URL) {
    tasks.push(
      sendDiscordNotification({
        webhookUrl: process.env.DISCORD_WEBHOOK_URL,
        payload: {
          embeds: [
            {
              title: `New feedback (${category})`,
              description: message,
              fields: [
                { name: 'Title', value: title },
                { name: 'From', value: fromEmail, inline: true },
              ],
              timestamp: new Date().toISOString(),
              footer: { text: 'Dashboard Feedback' },
            },
          ],
        },
      })
    );
  }

  if (adminEmail) {
    tasks.push(
      sendEmail({
        email: adminEmail,
        subject: `[WakeMark] New feedback (${category}): ${title}`,
        react: FeedbackAdminEmail,
        reactProps: {
          category,
          title,
          message,
          fromEmail,
          fromName,
          inboxUrl,
        },
        hasUnsubscribeLink: false,
      }).catch((error) => {
        console.error('Failed to send feedback admin email:', error);
      })
    );
  } else {
    console.warn(
      'ADMIN_EMAIL and EMAIL_FROM_ADDRESS are not set, skipping feedback email.'
    );
  }

  await Promise.allSettled(tasks);
}
