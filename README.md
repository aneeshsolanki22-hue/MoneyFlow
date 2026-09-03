# Money follow Brother 💸

A dark, animated expense & income tracker for Android, built with **React Native + Expo** (TypeScript).
UI follows the Penpot design in `expnese tracker.pen` (by Toukir Solanki).

## Features

- **Onboarding** — full-bleed background, staggered entrance animations, name input (shown once, first launch only)
- **Home / Money Tracker** — orange→red gradient header, greeting, total balance with count-up animation, monthly income/expense badges, month switcher, transactions grouped by day (TODAY / YESTERDAY / date)
- **Bottom tab bar** — docked INCOME | EXPENSE bar opens the add-entry sheets
- **Add Income / Add Expense** — spring bottom sheets with amount, note, and category/source chips (Salary, Freelance, Gift, Investment… / Food, Groceries, Transport, Utilities, Bills…)
- **Settings** — Google account card with real native sign-in (account picker) + connection progress bar, Backup / Restore to your own Google Drive, About card
- **Persistence** — all data stored locally via AsyncStorage (INR ₹ formatting, Indian digit grouping)

## Run locally

```bash
npm install
npm start        # Expo dev server (scan QR with Expo Go)
npm run android  # Android emulator / device
npm run web      # browser preview
```

> ⚠️ Google Drive backup needs a **development build** (it uses native Google Sign-In, which doesn't run in Expo Go).
> Build one with `npx eas build --platform android --profile development` and install the APK, then `npm start` and press `a`.

## Google Drive backup setup (one time)

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com), then enable the **Google Drive API**.
2. Configure the **OAuth consent screen** (External, add yourself as a test user).
3. Create an OAuth client ID of type **Web application** and copy its client ID.
4. Paste it into `app.json` → `extra.googleClientIds.webClientId` (replacing `REPLACE_WITH_WEB_CLIENT_ID`).
5. Add the **SHA-1** of your signing certificate to an **Android** OAuth client ID in the same project (package `com.toukirsolanki.moneyfollowbrother`) so the native picker can identify the app.
6. Rebuild the development build so the config takes effect.

## Build the APK with Expo Cloud (EAS)

1. Install EAS CLI and log in:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. Create the project on Expo and run the cloud build (from this folder):
   ```bash
   eas init
   eas build --platform android --profile preview
   ```
   The `preview` profile produces a shareable, installable **.apk** (see `eas.json`).

## Project layout

```
App.tsx                      # root: fonts, splash, onboarding/home switch
src/
  screens/                   # OnboardingScreen, HomeScreen, AddTransactionModal, SettingsModal
  components/                # AnimatedModal, BottomTabBar, Chip, TransactionRow, Toast, CountUpText
  data/categories.ts         # income sources + expense categories (icons & colors)
  utils/                     # format.ts (INR/dates), storage.ts (AsyncStorage)
  theme.ts                   # colors & fonts
  types.ts
scripts/generate-icons.js    # regenerates app icon / splash assets (node scripts/generate-icons.js)
```

## Roadmap (not yet implemented)

- Encrypted backup & restore via Google Drive
- Transaction edit / delete
