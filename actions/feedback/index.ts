'use server';

import { actionResponse, ActionResult } from '@/lib/action-response';
import { getSession, isAdmin } from '@/lib/auth/server';
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
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.');
  }

  const parsed = submitFeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return actionResponse.badRequest(
      parsed.error.issues[0]?.message ?? 'Invalid feedback payload.'
    );
  }

  try {
    const session = await getSession();
    const [created] = await db
      .insert(feedbacks)
      .values({
        userId: session?.user?.id,
        category: parsed.data.category,
        title: parsed.data.title,
        message: parsed.data.message,
      })
      .returning({ id: feedbacks.id });

    // Best-effort notification, never blocks the submission flow.
    if (process.env.DISCORD_WEBHOOK_URL) {
      await sendDiscordNotification({
        webhookUrl: process.env.DISCORD_WEBHOOK_URL,
        payload: {
          embeds: [
            {
              title: `New feedback (${parsed.data.category})`,
              description: parsed.data.message,
              fields: [
                { name: 'Title', value: parsed.data.title },
                {
                  name: 'From',
                  value: session?.user?.email ?? 'unknown',
                  inline: true,
                },
              ],
              timestamp: new Date().toISOString(),
              footer: { text: 'Dashboard Feedback' },
            },
          ],
        },
      });
    }

    return actionResponse.success({ id: created.id });
  } catch (error) {
    return actionResponse.error(getErrorMessage(error));
  }
};
