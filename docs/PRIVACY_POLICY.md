# Privacy Policy for Destiny

**Last Updated:** July 22, 2026

Destiny is a free app that lets a group of people share their live location with each other on the way to a shared destination. This page explains what data Destiny collects, how it's used, and how it's shared, so you can decide whether to use the app.

Destiny has **no accounts and no login screen**. There's no email, password, or phone number involved anywhere in the app.

## Information We Collect

### Display Name
The first time you open Destiny, you're asked for a display name — just so the rest of your group can tell you apart on the map. This name is stored only on your device. It's shared with the other members of a journey **only while you're actively part of that journey**, so they can see whose location marker is whose.

### Location Data
While you're actively part of a journey (from the moment you create or join one, until you leave or it ends), Destiny reads your device's GPS location and shares it with the other members of that same journey so everyone can see each other's position and distance to the destination on a live map.

- By default, location is only tracked **while the app is open and in the foreground** — it stops as soon as you background or close the app.
- When you start or join a journey, you're asked whether to allow "Always" (background) location access so your position keeps updating for the group even while you're using another app, like Maps for directions. This is optional: if you decline or only grant "While Using the App," Destiny falls back to foreground-only tracking with no loss of functionality besides that pause when backgrounded.
- Location is **not tracked at all** unless you are actively in a journey, and any background tracking stops the moment you leave or end that journey.
- Your location is visible only to the other members of the same journey (identified by a private journey code), never published or made visible to anyone else.

### Device Identifier
Destiny uses Firebase Anonymous Authentication to give your device a random, non-identifying ID. This ID isn't linked to your name, email, or any other personal information — it exists purely so the app's backend can tell which location update came from which device within a journey, and to enforce that you can only ever update your own location, not anyone else's.

### Camera
If you scan a QR code to join a journey, Destiny briefly uses your camera to read the code. Nothing captured by the camera is stored, saved, or transmitted anywhere — it's used only to decode the QR code on your device in that moment.

### Journey History
A local list of journeys you've created or joined (destination name, your role, and timestamps) is stored only on your device, so you can see your past journeys in the app. This history is never uploaded or shared with anyone.

## How Journey Data Is Stored and Deleted

While a journey is active, its destination and each member's location are stored in a Firestore database (provided by Google Firebase) so they can sync live between everyone's devices. When the journey creator ends the journey, that data is **deleted immediately** — it isn't retained or archived anywhere. If you leave a journey without ending it, your location is removed from that journey, though the journey itself continues to exist for the remaining members until they end it.

## Third-Party Services

Destiny relies on the following third-party services to function. Each is governed by its own privacy policy, which we encourage you to review:

- **Google Firebase** (Authentication and Firestore database) — used to sync journey and location data between group members. See [Google's Privacy Policy](https://policies.google.com/privacy).
- **Google Maps Platform** (Maps SDK and Places API) — used to display the map and power destination search/autocomplete. Search text you type is sent to Google to return matching places. See [Google's Privacy Policy](https://policies.google.com/privacy).

Destiny does **not** use any advertising, analytics, or tracking SDKs, and does not sell or share your data with any third party for marketing purposes.

## Children's Privacy

Destiny does not knowingly collect information from children under 13. Since the app collects no email, account, or persistent identity beyond a device-local display name, we have no practical way to identify a user's age. If you're a parent or guardian and believe your child has used the app in a way that concerns you, please contact us using the details below.

## Data Security

Location and journey data are transmitted over encrypted connections to Firebase. As with any online service, no method of transmission or storage can be guaranteed 100% secure, but we don't retain journey data any longer than the journey itself is active.

## Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date.

## Contact Us

If you have questions about this Privacy Policy, contact us at vinodsigadana030@gmail.com.
