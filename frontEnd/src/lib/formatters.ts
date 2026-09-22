import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

export function formatDate(dateString?: string, formatStr: string = 'dd MMM yyyy'): string {
  if (!dateString) return '—';
  try {
    const parsed = parseISO(dateString);
    if (!isValid(parsed)) return dateString;
    return format(parsed, formatStr);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  return formatDate(dateString, 'dd MMM yyyy, hh:mm a');
}

export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const parsed = parseISO(dateString);
    if (!isValid(parsed)) return dateString;
    return formatDistanceToNow(parsed, { addSuffix: true });
  } catch {
    return dateString;
  }
}

export function formatMinutesWait(minutes?: number): string {
  if (minutes === undefined || minutes === null) return '—';
  if (minutes < 1) return 'Immediate';
  if (minutes < 60) return `${minutes} mins`;
  const hrs = Math.floor(minutes / 60);
  const remMins = minutes % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs} hrs`;
}

export function formatAbhaId(abha?: string): string {
  if (!abha) return 'Not linked';
  // Standard ABHA 14-digit format: 12-3456-7890-1234
  const digits = abha.replace(/\D/g, '');
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 14)}`;
  }
  return abha;
}

export function maskPhoneNumber(phone?: string): string {
  if (!phone) return '—';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 2)}*** ***${clean.slice(8)}`;
  }
  return phone;
}
