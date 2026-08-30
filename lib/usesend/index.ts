import 'server-only';

const DEFAULT_BASE_URL = 'https://app.usesend.com';

export const isUseSendConfigured = () =>
  Boolean(process.env.USESEND_API_KEY?.trim() && process.env.USESEND_BASE_URL?.trim());

function getBaseUrl() {
  return (process.env.USESEND_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, '');
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const apiKey = process.env.USESEND_API_KEY?.trim();
  if (!apiKey) throw new Error('USESEND_API_KEY is not configured');

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    let detail = await response.text();
    try {
      const body = JSON.parse(detail);
      detail = typeof body?.message === 'string' ? body.message : JSON.stringify(body);
    } catch {
      // Keep the plain-text response when it is not JSON.
    }
    throw new Error(`UseSend API request failed (${response.status}): ${detail}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export interface UseSendEmailInput {
  to: string;
  from: string;
  subject: string;
  html: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export async function sendUseSendEmail(input: UseSendEmailInput) {
  return request<{ emailId?: string; id?: string }>('/api/v1/emails', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function addUseSendContact(email: string) {
  const bookId = process.env.USESEND_CONTACT_BOOK_ID?.trim();
  if (!bookId) return;

  const encodedEmail = encodeURIComponent(email);
  const existing = await request<Array<{ id: string; email: string }>>(
    `/api/v1/contactBooks/${encodeURIComponent(bookId)}/contacts?emails=${encodedEmail}`,
  );
  if (existing.some((contact) => contact.email.toLowerCase() === email.toLowerCase())) return;

  await request(`/api/v1/contactBooks/${encodeURIComponent(bookId)}/contacts`, {
    method: 'POST',
    body: JSON.stringify({ email, subscribed: true }),
  });
}

export async function removeUseSendContact(email: string) {
  const bookId = process.env.USESEND_CONTACT_BOOK_ID?.trim();
  if (!bookId) return;

  const encodedEmail = encodeURIComponent(email);
  const existing = await request<Array<{ id: string; email: string }>>(
    `/api/v1/contactBooks/${encodeURIComponent(bookId)}/contacts?emails=${encodedEmail}`,
  );
  const contact = existing.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!contact) return;

  await request(
    `/api/v1/contactBooks/${encodeURIComponent(bookId)}/contacts/${encodeURIComponent(contact.id)}`,
    { method: 'DELETE' },
  );
}
