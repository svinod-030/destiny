# ConvoyMates

Track a group's live location on the way to a shared destination. One person starts a
journey by dropping a pin, everyone else joins with a 6-character code (or by scanning a
QR code), and the whole group sees each other's position and distance to the destination
on a live map.

Built with Expo + React Native, mirroring the architecture of this author's other app,
[cric-score](https://github.com/vinodsigadana/cric-score): a Firestore document per
session, `onSnapshot` for real-time sync, and a join-by-code/QR flow.

## How it works

- No accounts or login screen — you just pick a display name the first time you open the
  app. Under the hood, Firebase Anonymous Auth silently gives your device a stable ID so
  the group can tell members apart and Firestore rules can stop anyone from spoofing
  someone else's location.
- Location sharing is **foreground-only by default**: it updates while the app is open,
  and pauses when it's backgrounded. When you start or join a journey, you're prompted
  once to optionally allow "Always" (background) access, which keeps your position
  updating for the group even while you're using another app (e.g. Maps for turn-by-turn
  directions). Declining just falls back to foreground-only — no functionality is lost,
  your marker simply stops updating while backgrounded, same as before.
- Ending a journey (or Firestore losing the code) simply removes the document; every
  connected device notices and shows a "journey ended" screen.
- Destination and intermediate stops share one draggable list — whichever pin you drag to
  the top slot becomes the destination. The creator can edit the route (add/remove/reorder
  stops, change the destination) after the journey has already started.

## Architecture

- **Firestore** — one document per journey (`journeys/{code}`), synced live via
  `onSnapshot`. Access control is entirely in [firestore.rules](firestore.rules): the
  creator can update anything, other members can only touch their own entry under
  `members`.
- **Cloud Functions** (`functions/`) — place search (autocomplete + details) is proxied
  through two callable functions (`placesAutocomplete`, `placesDetails`) instead of
  calling Google's Places API directly from the app. The real Places API key lives only
  in Secret Manager, never in the client. Each call requires a signed-in (anonymous is
  fine) user and is rate-limited per user per day via a Firestore counter.
- **Firebase App Check** — gates those two functions so only requests from a genuine,
  unmodified build of this app are accepted (Play Integrity on Android, App Attest on
  iOS), not just anyone holding a stolen Auth token. See
  [src/utils/appCheck.ts](src/utils/appCheck.ts) for how this bridges into the plain
  Firebase JS SDK used everywhere else in the app.
- **Google Maps SDK key** (Android only — iOS uses Apple Maps for free) is the one API
  key that's unavoidably embedded in the client, since the native SDK needs it locally to
  render tiles. It's restricted in Google Cloud Console (API + Application restriction)
  rather than hidden, since it can't be hidden.

## One-time setup

### Prerequisites

- Node 20, npm
- [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`)
- Xcode + CocoaPods (iOS), Android Studio + a JDK 17 (Android)
- A [Firebase](https://console.firebase.google.com) project — either ask for access to
  the shared one this app already uses, or create your own independent one (see below)

### 1. Clone and install

```
git clone <this repo>
cd destiny
npm install
cd functions && npm install && cd ..
```

### 2. Firebase project

**If you're joining as a collaborator on this app**, ask the maintainer to add you as an
Editor on the Firebase project (see `.firebaserc` for the project ID) — then skip to step
3 for the values you still need locally. `google-services.json` (Android) is already
committed and configured for this project; you only need `GoogleService-Info.plist`
(iOS), downloaded from Firebase Console → Project Settings → your iOS app, placed at the
project root.

**If you're setting up your own independent instance:**
- Create a project at [console.firebase.google.com](https://console.firebase.google.com).
- Enable **Firestore** (production or test mode — the app ships its own
  [firestore.rules](firestore.rules)). Deploy them:
  `firebase deploy --only firestore:rules`.
- Enable **Authentication → Sign-in method → Anonymous**. Required, not optional —
  without it every sign-in attempt fails and actions like "Start Journey" silently
  refuse to do anything.
- Register an Android app and an iOS app (Project Settings → Your apps) to get
  `google-services.json` and `GoogleService-Info.plist`. Replace the committed
  `google-services.json` (both at the project root and `android/app/`) and add
  `GoogleService-Info.plist` at the project root — `app.json`'s `googleServicesFile`
  fields point at both.
- Register a Web app too (Project Settings → Your apps → Add app → Web) — this is a
  *different* auto-generated key from the Android one, and it's what powers the values
  in `.env` below.
- Update `.firebaserc` to point at your project ID.

### 3. Environment variables

```
cp .env.example .env
```

Fill in the `EXPO_PUBLIC_FIREBASE_*` values from your Web app's config (Project Settings
→ Your apps → the Web app → SDK setup and configuration).

For `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`: create an API key in
[Google Cloud Console](https://console.cloud.google.com/) with **"Maps SDK for
Android"** enabled, restricted to Application = Android apps (this project's package
name + your debug/release SHA-1 cert fingerprint - `keytool -list -v -keystore ...`,
or Play Console → Setup → App signing if Play App Signing is enabled) and API = "Maps
SDK for Android" only.

There's no client-side Places API key anymore — see Cloud Functions below.

### 4. Cloud Functions

Place search is proxied through Cloud Functions (`functions/`), not called from the app
directly:

```
firebase functions:secrets:set PLACES_API_KEY
firebase deploy --only functions
```

The key needs **"Places API (New)"** enabled in Google Cloud Console, restricted to that
API only (no Application restriction — the function is the only caller). Set a
budget/quota alert on it too, since this is the actual security boundary, not secrecy.

### 5. App Check debug tokens (local development)

The app uses Play Integrity/App Attest in production, but on `__DEV__` builds it uses a
per-install debug token instead. On first launch, check the logs:

- **Android**: `adb logcat | grep -i "debug secret"` — look for
  `DebugAppCheckProvider: Enter this debug secret into the allow list...`
- **iOS**: check Xcode's console output for a similar debug token line.

Register that token: Firebase Console → **Build → App Check** → **Apps** tab → your app
→ Manage debug tokens → Add. Without this, you'll see `App attestation failed` in the
app's logs. Whether that actually *blocks* Places search depends on
`ENFORCE_APP_CHECK` in [functions/src/index.ts](functions/src/index.ts) - it's a
staged rollout flag, off until Cloud Functions logs consistently show real traffic
carrying a valid token, then flipped on.

A fresh install/rebuild generates a **new** debug token — re-check and re-register
whenever that happens.

### 6. Run it

```
npx expo run:ios
npx expo run:android
```

Run on a real device or simulator with location services available — the map/GPS
features won't do much in a browser preview.

## Testing

```
npm test           # unit tests for journeyService, geo utils, and the journey store
npm run compile    # tsc --noEmit
```

Functions have their own project/build:

```
cd functions
npm run build       # tsc
```

## CI/CD

[.github/workflows/android-build.yml](.github/workflows/android-build.yml) builds a
release APK/AAB on demand (Actions tab → Android Build → Run workflow). It needs these
repository secrets: all the `EXPO_PUBLIC_FIREBASE_*` / `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
values (same as `.env`), plus `KEYSTORE_BASE64` (your release keystore, base64-encoded),
`KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`. `google-services.json` doesn't need a
secret — it's committed (see Architecture above for why that's safe here).

## Project structure

```
functions/
  src/index.ts  Cloud Functions: placesAutocomplete, placesDetails (Places API proxy)
src/
  components/   Shared UI (share card, member list row, draggable stops list, edit-route modal)
  hooks/        useJourneySync (join-by-code), useLiveLocation (GPS -> Firestore)
  navigation/   Bottom tabs + the pushed live-map screen
  screens/      HomeScreen (create), JoinJourneyScreen, JourneyMapScreen, History, Settings
  services/     journeyService.ts (Firestore), placesService.ts (calls the Functions above)
  store/        Zustand stores (auth/name, active journey, journey history, theme)
  types/        Shared Journey/JourneyMember/Destination types
  utils/        firebase.ts, appCheck.ts, geo.ts (distance), color.ts (member marker colors)
```

## Privacy Policy

See [docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md) — required if you submit this app to
the Play Store or App Store, since it requests location and camera permissions. You'll
need to host this page somewhere with a public URL (e.g. GitHub Pages, or paste its raw
GitHub URL) to enter into Play Console / App Store Connect.
