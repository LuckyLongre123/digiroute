import fs from 'node:fs/promises';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { db } from '@/prisma/db';

export type ConsentAction = 'ACCEPTED' | 'REVOKED';
export type ConsentSource = 'REGISTER' | 'SETTINGS';

export interface ConsentLogRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string | null;
  consentType: string;
  action: ConsentAction;
  policyVersion: string;
  source: ConsentSource;
  userAgent?: string | null;
  createdAt: string; // ISO 8601 UTC timestamp
}

export interface UserConsentState {
  accepted: boolean;
  lastAction: ConsentAction | null;
  lastUpdatedAt: string | null;
  history: ConsentLogRecord[];
}

export interface ConsentAuditSummary {
  totalAcceptedUsers: number;
  totalRevokedUsers: number;
  totalEvents: number;
}

export interface FormattedConsentLog extends ConsentLogRecord {
  humanReadable: string;
  formattedDateIST: string;
}

export interface AllConsentAuditData {
  summary: ConsentAuditSummary;
  logs: FormattedConsentLog[];
  userStatuses: Array<{
    userId: string;
    userEmail: string;
    userName: string | null;
    currentStatus: ConsentAction;
    lastUpdatedAt: string;
    formattedDateIST: string;
  }>;
}

const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'src', 'data');
const LOCAL_STORAGE_FILE = path.join(LOCAL_STORAGE_DIR, 'consent-logs.json');

// Memory cache for resilience and fast lookups
const consentMemoryCache: ConsentLogRecord[] = [];
let cacheLoaded = false;

/**
 * Ensure the local JSON fallback mirror file exists
 */
async function ensureLocalStorage(): Promise<void> {
  if (cacheLoaded) return;
  try {
    await fs.mkdir(LOCAL_STORAGE_DIR, { recursive: true });
    try {
      const content = await fs.readFile(LOCAL_STORAGE_FILE, 'utf-8');
      const list: ConsentLogRecord[] = JSON.parse(content);
      consentMemoryCache.length = 0;
      consentMemoryCache.push(...list);
    } catch {
      await fs.writeFile(LOCAL_STORAGE_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
    cacheLoaded = true;
  } catch (err) {
    console.warn('[ConsentLogger] Local fallback storage init warning:', err);
  }
}

/**
 * Safely mirror an event to the local filesystem file
 */
async function mirrorToLocalFile(record: ConsentLogRecord): Promise<void> {
  try {
    await ensureLocalStorage();
    consentMemoryCache.push(record);
    await fs.writeFile(
      LOCAL_STORAGE_FILE,
      JSON.stringify(consentMemoryCache, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.error('[ConsentLogger] Failed to write local JSON mirror:', err);
  }
}

/**
 * Format an ISO timestamp to human-readable IST string
 */
export function formatToIST(isoString: string): string {
  try {
    const date = new Date(isoString);
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    return `${formatter.format(date)} IST`;
  } catch {
    return isoString;
  }
}

/**
 * Generate human-readable audit narrative
 */
export function generateHumanReadableNarrative(
  record: Pick<ConsentLogRecord, 'userName' | 'userEmail' | 'action' | 'policyVersion' | 'source' | 'createdAt'>
): string {
  const nameDisplay = record.userName?.trim() || 'User';
  const emailDisplay = record.userEmail ? `(${record.userEmail})` : '';
  const dateIST = formatToIST(record.createdAt);
  const version = record.policyVersion || 'v1.0';
  const sourceLabel = record.source === 'REGISTER' ? 'Registration' : 'Settings';

  if (record.action === 'ACCEPTED') {
    return `${nameDisplay} ${emailDisplay} accepted Age (13+) & Terms (${version}) via ${sourceLabel} on ${dateIST}`;
  }
  return `${nameDisplay} ${emailDisplay} unticked / revoked Age (13+) & Terms (${version}) via ${sourceLabel} on ${dateIST}`;
}

/**
 * Record a normalized consent audit event
 * Writes to Prisma DB + mirrors to local JSON fallback without throwing to caller
 */
export async function recordConsentEvent(params: {
  userId: string;
  userEmail: string;
  userName?: string | null;
  consentType?: string;
  action: ConsentAction;
  policyVersion?: string;
  source: ConsentSource;
  userAgent?: string | null;
}): Promise<ConsentLogRecord> {
  const id = `consent_${nanoid()}`;
  const now = new Date();
  const createdAt = now.toISOString();

  const record: ConsentLogRecord = {
    id,
    userId: params.userId,
    userEmail: params.userEmail.trim().toLowerCase(),
    userName: params.userName?.trim() || null,
    consentType: params.consentType || 'AGE_AND_TERMS',
    action: params.action,
    policyVersion: params.policyVersion || 'v1.0',
    source: params.source,
    userAgent: params.userAgent?.slice(0, 500) || null,
    createdAt,
  };

  // 1. Mirror to local JSON fallback immediately
  await mirrorToLocalFile(record);

  // 2. Persist to Prisma Database
  try {
    await db.orm.public.ConsentLog.create({
      id: record.id,
      userId: record.userId,
      userEmail: record.userEmail,
      userName: record.userName,
      consentType: record.consentType,
      action: record.action,
      policyVersion: record.policyVersion,
      source: record.source,
      userAgent: record.userAgent,
      createdAt: record.createdAt,
    });
  } catch (dbErr) {
    console.warn('[ConsentLogger] Database write error (local mirror preserved):', dbErr);
  }

  return record;
}

/**
 * Retrieve the current consent status for a specific user
 * Returns accepted: boolean, lastAction, lastUpdatedAt, and full history
 */
export async function getUserConsentState(userId: string): Promise<UserConsentState> {
  if (!userId) {
    return { accepted: false, lastAction: null, lastUpdatedAt: null, history: [] };
  }

  let logs: ConsentLogRecord[] = [];

  // Try database first
  try {
    const dbLogs = await db.orm.public.ConsentLog.where({ userId }).all();
    if (dbLogs && dbLogs.length > 0) {
      logs = dbLogs.map((item) => ({
        id: item.id,
        userId: item.userId || '',
        userEmail: item.userEmail,
        userName: item.userName,
        consentType: item.consentType,
        action: item.action as ConsentAction,
        policyVersion: item.policyVersion,
        source: item.source as ConsentSource,
        userAgent: item.userAgent,
        createdAt: item.createdAt,
      }));
    }
  } catch (err) {
    console.warn('[ConsentLogger] DB fetch failed in getUserConsentState, using local fallback:', err);
  }

  // Fallback to local memory cache if DB returned empty or failed
  if (logs.length === 0) {
    await ensureLocalStorage();
    logs = consentMemoryCache.filter((log) => log.userId === userId);
  }

  // Sort newest first
  logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (logs.length === 0) {
    return {
      accepted: false,
      lastAction: null,
      lastUpdatedAt: null,
      history: [],
    };
  }

  const latest = logs[0];
  return {
    accepted: latest.action === 'ACCEPTED',
    lastAction: latest.action,
    lastUpdatedAt: latest.createdAt,
    history: logs,
  };
}

/**
 * Retrieve all consent audit data for Admin inspection
 */
export async function getAllConsentAuditData(): Promise<AllConsentAuditData> {
  let allLogs: ConsentLogRecord[] = [];

  // Try DB
  try {
    const dbLogs = await db.orm.public.ConsentLog.all();
    if (dbLogs && dbLogs.length > 0) {
      allLogs = dbLogs.map((item) => ({
        id: item.id,
        userId: item.userId || '',
        userEmail: item.userEmail,
        userName: item.userName,
        consentType: item.consentType,
        action: item.action as ConsentAction,
        policyVersion: item.policyVersion,
        source: item.source as ConsentSource,
        userAgent: item.userAgent,
        createdAt: item.createdAt,
      }));
    }
  } catch (err) {
    console.warn('[ConsentLogger] DB fetch failed in getAllConsentAuditData, using local fallback:', err);
  }

  // Fallback or merge with local mirror
  await ensureLocalStorage();
  if (allLogs.length === 0) {
    allLogs = [...consentMemoryCache];
  } else {
    // Merge any missing from memory cache
    const existingIds = new Set(allLogs.map((l) => l.id));
    for (const cached of consentMemoryCache) {
      if (!existingIds.has(cached.id)) {
        allLogs.push(cached);
      }
    }
  }

  // Sort newest first
  allLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Aggregate user latest statuses
  const userMap = new Map<
    string,
    {
      userId: string;
      userEmail: string;
      userName: string | null;
      currentStatus: ConsentAction;
      lastUpdatedAt: string;
      formattedDateIST: string;
    }
  >();

  for (const log of allLogs) {
    if (!userMap.has(log.userId)) {
      userMap.set(log.userId, {
        userId: log.userId,
        userEmail: log.userEmail,
        userName: log.userName || null,
        currentStatus: log.action,
        lastUpdatedAt: log.createdAt,
        formattedDateIST: formatToIST(log.createdAt),
      });
    }
  }

  let totalAcceptedUsers = 0;
  let totalRevokedUsers = 0;

  for (const status of userMap.values()) {
    if (status.currentStatus === 'ACCEPTED') {
      totalAcceptedUsers++;
    } else {
      totalRevokedUsers++;
    }
  }

  const formattedLogs: FormattedConsentLog[] = allLogs.map((log) => ({
    ...log,
    humanReadable: generateHumanReadableNarrative(log),
    formattedDateIST: formatToIST(log.createdAt),
  }));

  return {
    summary: {
      totalAcceptedUsers,
      totalRevokedUsers,
      totalEvents: allLogs.length,
    },
    logs: formattedLogs,
    userStatuses: Array.from(userMap.values()),
  };
}
