# PhotoStudio Manager

An all-in-one studio management app for photographers to manage **clients**, **bookings**
(with a dedicated Wedding form), and **payments** (schedules + installments). Built for
Android and iOS with a Windows desktop edition, all backed by a single Supabase account
that keeps every device in sync.

## Features

- **Clients** - profiles with contact details, addresses, and notes; quick call/email,
  edit, and guarded cascade-delete.
- **Bookings** - event-type picker with dedicated Standard and complete Wedding forms
  (wedding/homecoming details, album preferences, photo sizes); one-tap status stepper
  (pending → completed), edit/delete/cancel, search and status filters.
- **Payments** - schedules (deposit / milestone / final / custom) and installments;
  schedules auto-mark themselves paid once installments cover the amount; overdue flags
  keep outstanding amounts visible.
- **Dashboard** - 4 stat tiles (Total Bookings / Active Clients / Monthly Revenue /
  Outstanding), an interactive monthly revenue bar chart with 1/3/6/12-month range
  selectors and a period total, Recent Bookings, and Payments Due; one-tap quick actions.
- **Profile** - switchable working currency (default LKR), desktop update controls.
- **Windows desktop** - Electron shell over the Expo web export with resizable window,
  automatic one-click Git-based updates, and both x86 and x64 installers.

## Tech stack

- Expo SDK 57, React Native 0.86, React 19.2, TypeScript
- Expo Router (file-based routing), React Native Paper (Material Design)
- Supabase (Postgres + Auth + RLS), `@supabase/supabase-js`
- TanStack Query v5, react-hook-form + zod v4
- Electron (desktop edition), electron-builder (NSIS installers)

## Project layout

```
src/app/                # Expo Router screens (auth, tabs, booking/client/payment flows)
src/components/         # Shared UI (cards, badges, inputs, empty states, RevenueChart, etc.)
src/forms/              # Reusable form schemas/components
src/hooks/              # TanStack Query data hooks per entity
src/lib/                # supabase client, constants, types, utils, desktop bridge
src/theme/              # Paper theme + palette
supabase/migrations/    # SQL schema + RLS + triggers (0001 init, 0002 RLS fix)
desktop/                # Electron Windows app (main, preload, static server, updater)
media/                  # logos, icons, branding
test_APK/               # release APKs (kept local; shipped via GitHub releases)
.env                    # EXPO_PUBLIC_* (client-safe) + service-role key (setup only)
```

Data model: every table is scoped by `user_id` (single photographer account) with RLS
`user_id = auth.uid()`. Bookings are polymorphic by `event_type`; `Wedding` uses
`wedding_*` columns. Payments live in `payment_schedules` + `payment_installments`
(a DB trigger auto-marks schedules `paid`).

## Development

```bash
npm install
npm start                 # start Expo dev server
npm run android           # run on Android device/emulator
npm run ios               # run on iOS simulator
npm run web               # run web build
npx tsc --noEmit          # typecheck
npm run lint              # lint
```

### Native build on Windows (important)

The project path contains spaces, which breaks CMake/ninja. Fix: the CMake flag
`-DCMAKE_SUPPRESS_REGENERATION=ON` must be present in
`node_modules/react-native-reanimated/android/build.gradle.kts` and
`node_modules/react-native-worklets/android/build.gradle.kts` after every `npm install`.
If a CMake build fails, delete `node_modules/**/.cxx` caches before rebuilding.

### Android release

```bash
cd android && .\gradlew.bat assembleRelease
```

Copy `android/app/build/outputs/apk/release/app-release.apk` to `test_APK/` as
`PhotoStudioManager-<version>.apk`. Release builds are signed with the private
`photostudio-release.keystore` (see `android/keystore.properties`). Gradle is pinned to
8.14.3 on Windows (newer 9.x wrappers fail with Kotlin DSL / Kotlin 2.3 compatibility issues).

## Windows desktop edition

The desktop app reuses the mobile source via an Expo web SPA export (`web.output = "single"`)
wrapped in an Electron shell under `desktop/`.

```bash
npm run export:web                          # expo export → desktop/dist
cd desktop && npm run build:x64             # → dist-windows/x64/PhotoStudioManager-Setup-x64.exe
cd desktop && npm run build:x86             # → dist-windows/x86/...-Setup-ia32.exe (rename to -x86.exe)
```

Produce `<installer>.sha256` checksum files and attach both installers + checksums to the
GitHub release. The built-in updater checks the project's latest GitHub release, picks the
installer for the machine architecture, verifies SHA-256, and installs silently - it
refuses to install on missing release/installer/checksum or checksum mismatch. Electron is
pinned to ^43.7.3 (the last patched line shipping win32-ia32 builds; 44+ drops 32-bit).

## Database

- `supabase/migrations/0001_init.sql` - schema, RLS policies, triggers (initial build).
- `supabase/migrations/0002_fix_installment_rls.sql` - removes the SECURITY DEFINER
  `apply_installment()` cross-tenant hole, adds the BEFORE-owner trigger, and fixes
  zero-amount schedules being auto-marked paid. Applied to the live Supabase instance on
  2026-09-20.

## Releases

- Windows releases on GitHub carry `PhotoStudioManager-Setup-{x64,x86}.exe` + `.sha256`
  (and the Android APK).
- Mobile version is bumped in `package.json` + `app.json` (`android.versionCode`);
  desktop version in `desktop/package.json` (compared by the updater).

## License

0BSD