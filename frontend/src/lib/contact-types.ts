export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  category: string;
  message: string;
  status: 'NEW' | 'REVIEWED' | 'RESOLVED';
  createdAt: string;
}

/**
 * Format ISO timestamp into Indian Standard Time (IST) readable format
 */
export function formatToIST(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return (
      new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(d) + ' IST'
    );
  } catch {
    return isoDate;
  }
}
