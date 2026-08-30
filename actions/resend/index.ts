'use server';

import resend from '@/lib/resend';
import { addUseSendContact, isUseSendConfigured, removeUseSendContact, sendUseSendEmail } from '@/lib/usesend';
import type { Resend } from 'resend';
import * as React from 'react';

interface SendEmailProps {
  email: string;
  subject: string;
  react: React.ComponentType<any> | React.ReactElement;
  reactProps?: Record<string, any>;
  isAddContacts?: boolean;
  /** Sender name, defaults to EMAIL_FROM_NAME */
  fromName?: string;
  /** Sender email, defaults to EMAIL_FROM_ADDRESS */
  fromEmail?: string;
  /** Whether to include unsubscribe link in headers, defaults to true */
  hasUnsubscribeLink?: boolean;
}

export async function sendEmail({
  email,
  subject,
  react,
  reactProps,
  isAddContacts = false,
  fromName,
  fromEmail,
  hasUnsubscribeLink = true,
}: SendEmailProps) {
  try {
    if (!email) {
      throw new Error('Email is required.');
    }

    const useSend = isUseSendConfigured();
    if (!useSend && !resend) {
      throw new Error('No email provider is configured.');
    }

    // add user to contacts
    if (isAddContacts) {
      if (useSend) await addUseSendContact(email);
      else await resend!.contacts.create({ email });
    }

    // send email
    const senderName = fromName ?? process.env.EMAIL_FROM_NAME;
    const senderEmail = fromEmail ?? process.env.EMAIL_FROM_ADDRESS;
    
    if (!senderEmail) {
      throw new Error('Sender email is not configured. Please set fromEmail or EMAIL_FROM_ADDRESS environment variable.');
    }
    
    const from = `${senderName} <${senderEmail}>`;
    const to = email;

    const emailContent = reactProps
      ? React.createElement(react as React.ComponentType<any>, reactProps)
      : (react as React.ReactElement);

    const headers: Record<string, string> = {};
    if (hasUnsubscribeLink) {
      const unsubscribeToken = Buffer.from(email).toString('base64');
      const unsubscribeLinkEN = `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe/newsletter?token=${unsubscribeToken}`;
      Object.assign(headers, {
        "List-Unsubscribe": `<${unsubscribeLinkEN}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
      });
    }

    if (useSend) {
      // react-dom/server must be lazily imported inside 'use server' files (Next build restriction)
      const { renderToStaticMarkup } = await import('react-dom/server');
      await sendUseSendEmail({
        from,
        to,
        subject,
        html: renderToStaticMarkup(emailContent),
        headers,
      });
    } else {
      const emailOptions: Parameters<Resend['emails']['send']>[0] = {
        from, to, subject, react: emailContent, headers,
      };
      await resend!.emails.send(emailOptions);
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function removeUserFromContacts(email: string) {
  try {
    if (!email) {
      return;
    }
    if (isUseSendConfigured()) await removeUseSendContact(email);
    else if (resend) await resend.contacts.remove({ email });

  } catch (error) {
    console.error('Failed to remove user from Resend contacts:', error);
    // Silently fail - we don't care about the result
  }
}
