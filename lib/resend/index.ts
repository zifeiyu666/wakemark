
import { Resend } from 'resend';
import { isUseSendConfigured } from '@/lib/usesend';

let resend: Resend | null = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else if (!isUseSendConfigured()) {
  console.warn('Warning: RESEND_API_KEY is not set');
}

export default resend;
