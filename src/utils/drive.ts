import Constants from 'expo-constants';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import type { CustomCategory, Transaction, UserProfile } from '../types';

/** Least-privilege scope: the app can only see files it created. */
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

/** Single backup file per Google account — backing up twice never duplicates. */
const FILE_NAME = 'money-follow-brother-backup.json';

const API = 'https://www.googleapis.com';

export interface BackupPayload {
  schemaVersion: 1;
  user: UserProfile;
  transactions: Transaction[];
  backedUpAt: number;
  currency?: string;
  customCategories?: CustomCategory[];
}

export interface GoogleClientIds {
  androidClientId: string;
  webClientId: string;
}

/** Read the OAuth client IDs from app.json `extra.googleClientIds`. */
export function getGoogleClientIds(): GoogleClientIds {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const ids = (extra.googleClientIds ?? {}) as Partial<GoogleClientIds>;
  return {
    androidClientId: (ids.androidClientId as string) || '',
    webClientId: (ids.webClientId as string) || '',
  };
}

/**
 * Interactive Google sign-in used by onboarding and settings.
 * Returns the access token + email, or null when the user cancels.
 * Throws on failure so callers keep their own error toasts.
 */
export async function signInWithGoogle(): Promise<{ token: string; email: string } | null> {
  const { webClientId, androidClientId } = getGoogleClientIds();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  GoogleSignin.configure({
    webClientId,
    ...(androidClientId ? { androidClientId } : {}),
    scopes: ['profile', 'email', DRIVE_SCOPE],
  });
  const result = await GoogleSignin.signIn();
  if (!isSuccessResponse(result)) return null; // user cancelled
  const tokens = await GoogleSignin.getTokens();
  if (!tokens.accessToken) throw new Error('No access token returned');
  return {
    token: tokens.accessToken,
    email: result.data.user.email || 'Google account',
  };
}

interface DriveInit {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}

async function driveFetch(token: string, path: string, init: DriveInit = {}): Promise<Response> {
  return fetch(`${API}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
    body: init.body,
  });
}

/** Locate the app's backup file (by fixed name) or null when it doesn't exist. */
async function findBackupFile(token: string): Promise<{ id: string } | null> {
  const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
  const res = await driveFetch(
    token,
    `/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)&spaces=drive`,
  );
  if (!res.ok) throw new Error(`Could not reach Google Drive (${res.status})`);
  const data = (await res.json()) as {
    files?: { id: string; modifiedTime?: string }[];
  };
  const files = data.files ?? [];
  // If duplicates ever exist (e.g. an orphaned file from a failed rename),
  // prefer the most recently modified one.
  files.sort((a, b) => (b.modifiedTime ?? '').localeCompare(a.modifiedTime ?? ''));
  return files[0] ?? null;
}

/** Create the file, then set its fixed name so future lookups are predictable. */
async function createBackupFile(token: string, body: string): Promise<void> {
  const res = await fetch(`${API}/upload/drive/v3/files?uploadType=media`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  const file = (await res.json()) as { id: string };
  const patch = await driveFetch(token, `/drive/v3/files/${file.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FILE_NAME }),
  });
  if (!patch.ok) throw new Error(`Could not name backup (${patch.status})`);
}

/** Overwrite the content of the existing backup file (no duplicate file created). */
async function updateBackupFile(token: string, fileId: string, body: string): Promise<void> {
  const res = await fetch(`${API}/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
}

/** Upsert the backup: update the existing file, or create it on first backup. */
export async function uploadBackup(token: string, payload: BackupPayload): Promise<void> {
  const body = JSON.stringify(payload);
  const existing = await findBackupFile(token);
  if (existing) await updateBackupFile(token, existing.id, body);
  else await createBackupFile(token, body);
}

/** Download the backup, validating the schema. Returns null when no backup exists. */
export async function downloadBackup(token: string): Promise<BackupPayload | null> {
  const existing = await findBackupFile(token);
  if (!existing) return null;
  const res = await driveFetch(token, `/drive/v3/files/${existing.id}?alt=media`);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const payload = (await res.json()) as BackupPayload;
  if (!payload || payload.schemaVersion !== 1 || !Array.isArray(payload.transactions)) {
    throw new Error('Backup file is not valid');
  }
  return payload;
}

