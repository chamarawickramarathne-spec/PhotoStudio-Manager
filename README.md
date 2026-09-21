# PhotoStudio Manager

An all-in-one studio management app for photographers to manage **clients**, **bookings**
(with a dedicated Wedding form), and **payments** (schedules + installments). One
web-first codebase runs on **Windows desktop** (Electron), **web** (browser), and
**Android** (Capacitor WebView), all backed by a single Supabase account that keeps
every device in sync.

## Features

- **Clients** - profiles with contact details, addresses, and notes; quick call/email,
  edit, and guarded cascade-delete.
- **Bookings** - event-type picker with dedicated Standard and complete Wedding forms
  (wedding/homecoming details, album preferences, photo sizes); one-tap status stepper
  (pending → completed), edit/delete/cancel, search and status filters.
- **Payments** - schedules (deposit / milestone / final / custom) and installments;
  schedules auto-mark themselves paid once installments cover the amount; overdue flags
  keep outstanding amounts visible. A booking can only ever have one final payment
  schedule (app guard + DB unique partial index).
- **Dashboard** - 4 stat tiles (Total Bookings / Active Clients / Monthly Revenue /
  Outstanding) with month-over-month trend badges, an interactive monthly revenue bar
  chart with 1/3/6/12-month range selectors, Next Shoots strip, and grouped Payments Due;
  one-tap quick actions; single-line stat row on wide screens.
- **Profile** - switchable working currency (default LKR); encrypted profile avatar
  (AES-GCM, web/desktop); desktop update controls.
- **Windows desktop** - Electron shell over the shared Vite SPA with resizable window,
  automatic one-click Git-based updates, and both x86 and x64 installers.

## Tech stack

- Vite 8 + `@vitejs/plugin-react`, TypeScript ~6, React 19.2
- React Native 0.86 (JS API) on react-native-web ~0.21, React Native Paper (Material Design)
- React Router v7 SPA (`createBrowserRouter` + typed adapter), `@react-native-vector-icons`
- Supabase (Postgres + Auth + RLS + PKCE), `@supabase/supabase-js`
- TanStack Query v5, react-hook-form + zod v4
- Electron 43.7.x (desktop, NSIS x64/x86), Capacitor 7 (Android)

## Project layout

```
index.html / vite.config.mts     # web-first build (Vite → desktop/dist)
src/main.tsx / src/App.tsx       # entry + providers (auth/query/paper/desktop updater)
src/navigation/router.tsx        # SPA route table + guards + expo-router-compatible adapter
src/app/                         # screen components (auth, tabs, booking/client/payment flows)
src/components/                  # Shared UI (cards, badges, inputs, empty states, RevenueChart, etc.)
src/forms/                       # Reusable form schemas/components
src/hooks/                       # TanStack Query data hooks per entity
src/lib/                         # supabase client, constants, types, utils, desktop bridge, media (WebCrypto)
src/theme/                       # Paper theme + palette
supabase/migrations/             # SQL schema + RLS + triggers (0001 init, 0002 RLS fix, 0003/0004 pending)
desktop/                         # Electron Windows app (main, preload, static server, updater)
android/                         # Capacitor Android project (generated; gitignored)
media/                           # logos, icons, branding, screenshots
test_APK/                        # release APKs (kept local; shipped via GitHub releases)
.env                             # EXPO_PUBLIC_* (client-safe) + service-role key (setup only)
```

Data model: every table is scoped by `user_id` (single photographer account) with RLS
`user_id = auth.uid()`. Bookings are polymorphic by `event_type`; `Wedding` uses
`wedding_*` columns. Payments live in `payment_schedules` + `payment_installments`
(a DB trigger auto-marks schedules `paid`).

## Development

```bash
npm install
npm run web                # start Vite dev server
npm run build              # Vite build → desktop/dist
npx tsc --noEmit           # typecheck
npm run lint               # ESLint (standalone flat config)
```

## Builds

### Web / Electron (Windows desktop)

```
npm run export:web                 # vite build → desktop/dist
cd desktop && npm run build:x64    # → dist-windows/x64/PhotoStudioManager-Setup-x64.exe
cd desktop && npm run build:x86    # → dist-windows/x86/...-Setup-ia32.exe (rename to -x86.exe)
```

Produce `<installer>.sha256` checksum files and attach both installers + checksums to the
GitHub release. The built-in updater checks the project's latest GitHub release, picks the
installer for the machine architecture, verifies SHA-256, and installs silently - it
refuses to install on missing release/installer/checksum or checksum mismatch. Electron is
pinned to ^43.7.3 (the last patched line shipping win32-ia32 builds; 44+ drops 32-bit).

### Android (Capacitor, no Expo/CMake)

Requires JDK 21 (`$env:JAVA_HOME` → a JDK 21 copy, e.g.
`E:\AIprojects\AI Agent\jdk-21\jdk-21`) and the Android SDK (`ANDROID_HOME` set).

```bash
npm run android:build       # export:web + cap sync android + gradlew assembleRelease
```

Copy `android/app/build/outputs/apk/release/app-release.apk` to `test_APK/` as
`PhotoStudioManager-<version>.apk`. Release builds are signed with the private
`photostudio-release.keystore` (see `android/keystore.properties`; gitignored). Versioning
(versionName/versionCode) is set in `android/app/build.gradle` in sync with
`package.json` `version` and the root `__APP_VERSION__`.

## Database

- `supabase/migrations/0001_init.sql` - schema, RLS policies, triggers (initial build).
- `supabase/migrations/0002_fix_installment_rls.sql` - removes the SECURITY DEFINER
  `apply_installment()` cross-tenant hole, adds the BEFORE-owner trigger, and fixes
  zero-amount schedules being auto-marked paid. Applied to the live Supabase instance on
  2026-09-20.
- `supabase/migrations/0003_one_final_schedule_per_booking.sql` - unique partial index
  enforcing at most one `final` payment schedule per booking.
- `supabase/migrations/0004_photographer_details.sql` - `profiles.avatar_data` /
  `avatar_mime` (encrypted avatar storage protocol replaces the public URL bucket).

**Migration 0003 + 0004 must be applied manually in the Supabase Dashboard → SQL Editor**
(no CLI transport is configured). Until they run, the index is inert and avatar uploads
are no-ops.

## Releases

- Windows releases on GitHub carry `PhotoStudioManager-Setup-{x64,x86}.exe` + `.sha256`
  (and the Android APK).
- Version is bumped in `package.json` (web/Android `__APP_VERSION__`) and
  `desktop/package.json` (compared by the updater); Android versionCode/versionName in
  `android/app/build.gradle`.

## License

0BSD