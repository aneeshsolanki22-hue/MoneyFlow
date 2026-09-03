# Google Sign-In + Drive Backup Setup Guide

Complete guide to recreate the Google OAuth and Drive backup feature in a new Expo app.

---

## 1. The OAuth Key

Your Google OAuth **Web Client ID**:

```
510345420972-0nn2i4nr2acve0etqnda0cf5rjetf8sv.apps.googleusercontent.com
```

This goes in `app.json` under `expo.extra.googleClientIds.webClientId`.

---

## 2. Install Packages

```bash
npx expo install @react-native-google-signin/google-signin expo-constants
```

---

## 3. app.json Configuration

Add to your `app.json`:

### Plugins array — register the native plugin:

```json
"plugins": [
  "@react-native-google-signin/google-signin"
]
```

### Extra config — store the OAuth client ID:

```json
"extra": {
  "googleClientIds": {
    "webClientId": "510345420972-0nn2i4nr2acve0etqnda0cf5rjetf8sv.apps.googleusercontent.com"
  }
}
```

---

## 4. Code Files to Copy

### `src/utils/drive.ts` — Full Drive API Layer

```typescript
import Constants from 'expo-constants';

/** Least-privilege scope: the app can only see files it created. */
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

/** Single backup file per Google account — backing up twice never duplicates. */
const FILE_NAME = 'money-follow-brother-backup.json';

const API = 'https://www.googleapis.com';

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
  const data = (await res.json()) as { files?: { id: string }[] };
  return data.files?.[0] ?? null;
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
export async function uploadBackup(token: string, payload: unknown): Promise<void> {
  const body = JSON.stringify(payload);
  const existing = await findBackupFile(token);
  if (existing) await updateBackupFile(token, existing.id, body);
  else await createBackupFile(token, body);
}

/** Download the backup. Returns null when no backup exists. */
export async function downloadBackup<T = unknown>(token: string): Promise<T | null> {
  const existing = await findBackupFile(token);
  if (!existing) return null;
  const res = await driveFetch(token, `/drive/v3/files/${existing.id}?alt=media`);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  return (await res.json()) as T;
}

/** Fetch the signed-in user's profile so we can show their email. */
export async function fetchGoogleProfile(
  token: string,
): Promise<{ email: string; name: string }> {
  const res = await fetch(`${API}/oauth2/v2/userinfo`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Could not load profile (${res.status})`);
  const data = (await res.json()) as { email?: string; name?: string };
  return { email: data.email ?? '', name: data.name ?? '' };
}
```

### `src/utils/google-auth.ts` — Sign-In / Sign-Out

```typescript
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { DRIVE_SCOPE, getGoogleClientIds } from './drive';

export async function signInWithGoogle(): Promise<{ token: string; email: string }> {
  const { webClientId } = getGoogleClientIds();

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  GoogleSignin.configure({
    webClientId,
    scopes: ['profile', 'email', DRIVE_SCOPE],
  });

  const result = await GoogleSignin.signIn();
  if (!isSuccessResponse(result)) throw new Error('Sign-in cancelled');

  const tokens = await GoogleSignin.getTokens();
  if (!tokens.accessToken) throw new Error('No access token returned');

  const email = result.data.user.email || 'Google account';
  return { token: tokens.accessToken, email };
}

export async function signOutGoogle(): Promise<void> {
  await GoogleSignin.signOut();
}
```

---

## 5. How to Use It in Your New App

```typescript
import { signInWithGoogle, signOutGoogle } from './utils/google-auth';
import { uploadBackup, downloadBackup } from './utils/drive';

// --- Sign in ---
const { token, email } = await signInWithGoogle();
console.log(`Signed in as ${email}`);

// --- Upload backup to Google Drive ---
await uploadBackup(token, {
  schemaVersion: 1,
  myData: 'whatever you want to back up',
  backedUpAt: Date.now(),
});

// --- Download backup from Google Drive ---
const backup = await downloadBackup(token);
if (backup) console.log('Restored:', backup);

// --- Sign out ---
await signOutGoogle();
```

---

## 6. Token Flow Summary

```
GoogleSignin.signIn()
    ↓
GoogleSignin.getTokens()
    ↓
tokens.accessToken  ←  this is the Bearer token
    ↓
uploadBackup(token, ...)     →  POST/PATCH to googleapis.com/drive/v3/files
downloadBackup(token)        →  GET from googleapis.com/drive/v3/files
fetchGoogleProfile(token)    →  GET googleapis.com/oauth2/v2/userinfo
```

All API calls use the header: `Authorization: Bearer ${token}`

---

## 7. Google Cloud Console Setup (One-Time)

The OAuth client ID is already created. You just need to make sure it's still active:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Find the project that owns client ID `510345420972-...`
3. **Enable Google Drive API** — APIs & Services → Library → search "Google Drive API" → Enable
4. **OAuth consent screen** — should already be configured (External type, your email as test user)
5. The **Web application** OAuth client ID is already created — that's the `webClientId` above
6. If your new app has a **different Android package name**, create a new **Android** OAuth client ID with the new package name + SHA-1 fingerprint, and add it as `androidClientId` in `app.json`

---

## 8. File Summary

| File | Purpose |
|---|---|
| `app.json` → `extra.googleClientIds.webClientId` | Stores the OAuth client ID |
| `app.json` → `plugins` array | Registers the Google Sign-In native plugin |
| `src/utils/drive.ts` | All Drive API calls (upload/download/find/profile) |
| `src/utils/google-auth.ts` | `signInWithGoogle()` and `signOutGoogle()` functions |
| `@react-native-google-signin/google-signin` | Native Google Sign-In package |
| `expo-constants` | Reads `app.json` extra config at runtime |

---

## 9. Important Notes

- **Expo Go won't work.** Google Sign-In needs a native module. Build a development client:
  ```bash
  npx eas build --platform android --profile development
  ```
  Install the APK, then run:
  ```bash
  npx expo start --dev-client
  ```

- **Drive scope**: `https://www.googleapis.com/auth/drive.file` — least privilege, app can only access files it created.

- **Backup file name**: `money-follow-brother-backup.json` — change this in `drive.ts` if your new app has a different name.

- **Access tokens are short-lived.** The token from `GoogleSignin.getTokens()` may expire. Call `GoogleSignin.getTokens()` again to refresh before each backup/restore if needed.
