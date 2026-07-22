# Destiny

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

## One-time setup

You'll need to create your own Firebase project and Google Maps API key — these aren't
included, since they're tied to your own account/billing.

1. **Firebase**
   - Create a project at [console.firebase.google.com](https://console.firebase.google.com).
   - Enable **Firestore** (in production or test mode — the app ships its own
     [firestore.rules](firestore.rules)).
   - Enable **Authentication → Sign-in method → Anonymous**. This is required, not
     optional — without it every sign-in attempt fails with
     `auth/admin-restricted-operation`, `uid` stays `null`, and actions like "Start
     Journey" or "Join" will silently refuse to do anything (you'll now get an alert
     explaining why, instead of nothing happening).
   - Deploy the rules: `firebase deploy --only firestore:rules` (requires the
     [Firebase CLI](https://firebase.google.com/docs/cli)).
   - Add a Web app in Project Settings to get your config values, then copy
     `.env.example` to `.env` and fill them in:
     ```
     cp .env.example .env
     ```

2. **Google Maps + Places (Android only — iOS uses Apple Maps for free)**
   - Create an API key in [Google Cloud Console](https://console.cloud.google.com/) with
     the **"Maps SDK for Android"** enabled (required, for the map itself) and the
     **"Places API (New)"** enabled (optional, powers live search-as-you-type
     suggestions on the Start Journey screen — without it, search still works via
     plain geocoding on Enter/tap-search, just without a suggestions dropdown).
     Note this is a separate API from the older "Places API" (legacy) — enabling
     the legacy one instead will fail with a "legacy API not enabled" error.
   - Replace `REPLACE_WITH_GOOGLE_MAPS_API_KEY` in [app.json](app.json) with it.
   - Also set `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env` to the same key, so the
     Places Autocomplete requests (made from JS, not the native Android SDK) can use
     it — a key restricted to "Android apps" won't work for this, since that
     restriction only recognizes requests from the native Maps SDK, not plain HTTP
     calls. Leave the key unrestricted, or use a separate key for this variable.

3. **Install and run**
   ```
   npm install
   npx expo start
   ```
   Run on a real device or simulator with location services available — the map/GPS
   features won't do much in a browser preview.

## Project structure

```
src/
  components/   Shared UI (share card, member list row)
  hooks/        useJourneySync (join-by-code), useLiveLocation (GPS -> Firestore)
  navigation/   Bottom tabs + the pushed live-map screen
  screens/      HomeScreen (create), JoinJourneyScreen, JourneyMapScreen, History, Settings
  services/     journeyService.ts (Firestore), placesService.ts (Google Places Autocomplete)
  store/        Zustand stores (auth/name, active journey, journey history)
  types/        Shared Journey/JourneyMember/Destination types
  utils/        firebase.ts, geo.ts (distance), color.ts (member marker colors)
```

## Testing

```
npm test           # unit tests for journeyService, geo utils, and the journey store
npm run compile    # tsc --noEmit
```

## Privacy Policy

See [docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md) — required if you submit this app to
the Play Store or App Store, since it requests location and camera permissions. You'll
need to host this page somewhere with a public URL (e.g. GitHub Pages, or paste its raw
GitHub URL) to enter into Play Console / App Store Connect.
