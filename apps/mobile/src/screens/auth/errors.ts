/**
 * Map an unknown thrown value (typically an AxiosError) to a user-facing
 * message. NestJS validation errors arrive as `{ message: string | string[] }`.
 */
import axios from 'axios';

export function apiErrorMessage(error: unknown, fallback: string): string {
  // eslint-disable-next-line import/no-named-as-default-member -- axios default helper
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const msg = data?.message;
    if (Array.isArray(msg) && msg.length > 0) return msg[0];
    if (typeof msg === 'string' && msg.length > 0) return msg;
    if (!error.response) return 'Sem conexão com o servidor. Tente novamente.';
  }
  return fallback;
}
