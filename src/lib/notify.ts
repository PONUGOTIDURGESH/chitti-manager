import { toast } from 'sonner';

const ERROR_WORDS = /(fail|could not|couldn't|can't|cannot|unable|error|invalid|enter a valid|not found|denied)/i;
const WARN_WORDS = /(already|duplicate|please|select|required)/i;

export function notify(message: unknown): void {
  const text = String(message ?? '').trim();
  if (!text) return;

  if (ERROR_WORDS.test(text)) toast.error(text, { duration: 6000 });
  else if (WARN_WORDS.test(text)) toast.warning(text, { duration: 5000 });
  else toast.success(text, { duration: 4000 });
}

// Makes every existing alert('...') in the app show a toast instead of a browser pop-up
export function installToastAlerts(): void {
  window.alert = (message?: unknown) => notify(message);
}