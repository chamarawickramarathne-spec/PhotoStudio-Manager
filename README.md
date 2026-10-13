# PhotoStudio Manager

An all-in-one studio management app for photographers to manage **clients**, **bookings**
(with a dedicated Wedding form), and **payments** (schedules + installments). A single
shared codebase ships as a **Windows desktop** app (Electron) and an **Android** app
(Capacitor WebView), both backed by a single Supabase account that keeps every device in
sync. There is no browser edition.

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
- **Invoices** - a shareable PDF invoice per booking with grouped package details, line
  items, totals, and native share / download.
- **Due-date reminders** - Android schedules OS notifications for each unpaid schedule
  (09:00 on the due date and 09:00 the following day); the Windows app shows a native
  toast the same way while it is running.
- **Dashboard** - 4 stat tiles (Total Bookings / Active Clients / Monthly Revenue /
  Outstanding) with month-over-month trend badges, an interactive monthly revenue bar
  chart with 1/3/6/12-month range selectors, Next Shoots strip, and grouped Payments Due;
  one-tap quick actions; single-line stat row on wide screens.
- **Reports** - revenue chart, collected/outstanding/overdue tiles, revenue by type,
  payment methods, top clients, and a bookings pipeline.
- **Profile** - switchable working currency (default LKR); encrypted profile avatar
  (AES-GCM); app update controls.
- **Windows desktop** - Electron shell over the shared app with a resizable window and
  automatic one-click Git-based updates (both x86 and x64 installers).

## Tech stack

- Vite 8 + `@vitejs/plugin-react`, TypeScript ~6, React 19.2
- React Native 0.86 (JS API) on react-native-web ~0.21, React Native Paper (Material Design)
- React Router v7 SPA (`createBrowserRouter` + typed adapter), `@react-native-vector-icons`
- Supabase (Postgres + Auth + RLS + PKCE), `@supabase/supabase-js`
- TanStack Query v5, react-hook-form + zod v4, jsPDF + jspdf-autotable
- Electron 43.7.x (desktop, NSIS x64/x86), Capacitor 7 (Android + local notifications)
- npm workspaces monorepo: `core` + `Windows application` + `Android Mobile`

## Project layout

```
core/                            # shared app source (react-native-web) consumed by both shells
  src/App.tsx                    # entry + providers (auth/query/paper/updater/notifications)
  src/navigation/router.tsx      # SPA route table + guards + expo-router-compatible adapter
  src/app/                       # screen components (auth, tabs, booking/client/payment/invoice flows)
  src/components/                # shared UI (cards, badges, inputs, invoice, dashboard, etc.)
  src/forms/                     # reusable form schemas/components
  src/hooks/                     # TanStack Query hooks per entity + app providers
  src/lib/                       # supabase client, constants, types, format, desktop bridge,
                                 #   notifications/, update/, invoice/, media (WebCrypto)
  src/theme/                     # Paper theme + palette
  vite.config.mts / index.html   # Vite build (outputs core/dist, embedded by both shells)
Windows application/             # Electron Windows app (main, preload, static server, updater)
Android Mobile/                  # Capacitor Android project + local psm-install plugin
supabase/migrations/             # SQL schema + RLS + triggers (0001–0005)
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
npm run dev                # start the Vite dev server for the shared core UI
npm run build              # Vite build → core/dist
npm run typecheck          # tsc --noEmit
npm run lint               # ESLint (standalone flat config)
```

The Vite dev server is internal development tooling only; the app is not shipped or
supported in a browser.

## Builds

### Windows (Electron)

```
npm run desktop:build:x64          # → Windows application/dist-windows/x64/PhotoStudioManager-Setup-x64.exe
npm run desktop:build:x86          # → dist-windows/x86/...-Setup-ia32.exe (rename to -x86.exe)
```

Each build runs `core`'s Vite build, copies `core/dist` into the Electron app, and packages
with electron-builder (NSIS). Produce `<installer>.sha256` checksum files and attach both
installers + checksums to the GitHub release. The built-in updater checks the project's
latest GitHub release, picks the installer for the machine architecture, verifies SHA-256,
and installs silently - it refuses to install on a missing release/installer/checksum or a
checksum mismatch. Electron is pinned to ^43.7.x (the last patched line shipping
win32-ia32 builds; 44+ drops 32-bit).

### Android (Capacitor, no Expo/CMake)

Requires JDK 21 (`$env:JAVA_HOME` → a JDK 21 copy, e.g.
`E:\AIprojects\AI Agent\jdk-21\jdk-21`) and the Android SDK (`ANDROID_HOME` set).

```bash
npm run android:build       # core build + cap sync android + gradlew assembleRelease
```

Copy `android/app/build/outputs/apk/release/app-release.apk` to `test_APK/` as
`PhotoStudioManager-<version>.apk`. Release builds are signed with the private
`photostudio-release.keystore` (see `android/keystore.properties`; gitignored). Versioning
(versionName/versionCode) is set in `android/app/build.gradle` in sync with
`package.json` `version` and the root `__APP_VERSION__`.

Since mobile 1.6.2 the Android app self-updates: on launch it checks the latest GitHub
release (CORS-open API) and, when a newer version ships a matching
`PhotoStudioManager-<tagVer>.apk` + `.sha256`, offers a one-tap install. The APK is
downloaded natively via `@capacitor/filesystem` (release-asset URLs are not CORS-open,
so WebView fetch cannot read them), SHA-256 verified by the local
`capacitor-plugin-psm-install` plugin, and installed through the app's FileProvider.
Fail-closed: a missing checksum or hash mismatch refuses the install (mismatched file is
deleted).

## Notifications

- **Android** - `@capacitor/local-notifications` schedules one OS notification per unpaid
  schedule at 09:00 on its due date ("Payment due today") and 09:00 the following day
  ("Payment overdue"). Schedules are rewired whenever the data changes, on app resume, and
  cleared on sign-out; the plugin restores them after a device reboot. Android 13+ prompts
  for notification permission on first use.
- **Windows** - the Electron main process shows a native toast once per schedule for each
  event while the app is running (deduped per schedule/event/due date). Electron has no
  background scheduler, so a toast cannot appear while the app is closed.

## Database

- `supabase/migrations/0001_init.sql` - schema, RLS policies, triggers (initial build).
- `0002_fix_installment_rls.sql` - removes the SECURITY DEFINER `apply_installment()`
  cross-tenant hole, adds the BEFORE-owner trigger, fixes zero-amount schedules being
  auto-marked paid.
- `0003_one_final_schedule_per_booking.sql` - unique partial index enforcing at most one
  `final` payment schedule per booking.
- `0004_photographer_details.sql` - `profiles.avatar_data` / `avatar_mime` (encrypted
  avatar storage replaces the public URL bucket).
- `0005_payment_schedule_cascade.sql` - deletes a booking's payment schedules (and
  installments) with the booking.

Migrations 0001–0004 are applied to the live Supabase instance; `0005` is applied
manually. Apply any new migration in the Supabase Dashboard → SQL Editor (no CLI transport
is configured).

## Releases

- Windows releases on GitHub carry `PhotoStudioManager-Setup-{x64,x86}.exe` + `.sha256`.
- Releases whose tag/version shipped shared-source changes must also attach
  `PhotoStudioManager-<version>.apk` + `.sha256` - the mobile updater refuses any release
  whose exact-name APK/checksum assets are missing (never leave a stale same-pattern APK on
  a release).
- Version is bumped in `package.json` (root + `core` + `Windows application` +
  `Android Mobile`) and `android/app/build.gradle` (versionCode/versionName).

## License

0BSD
