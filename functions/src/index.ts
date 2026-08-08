import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

// Real Google key never leaves this function - stored in Secret Manager, set
// via `firebase functions:secrets:set PLACES_API_KEY`. Needs "Places API
// (New)" enabled; no Application restriction possible/needed here since this
// is the only caller.
const PLACES_API_KEY = defineSecret('PLACES_API_KEY');

const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const DETAILS_URL = 'https://places.googleapis.com/v1/places';

// India-focused app (see HomeScreen's default map region) - deploying close
// to users cuts autocomplete latency noticeably vs. the us-central1 default.
const REGION = 'asia-south1';

// Generous per-user daily ceiling - this is a cost/abuse backstop, not a
// feature limit. Tune based on real usage once you have data.
const DAILY_REQUEST_LIMIT = 300;

// STAGED ROLLOUT: start false so real (but not-yet-App-Check-token-carrying)
// clients aren't locked out. logAppCheckStatus below reports whether each
// call actually arrived with a valid token - once Cloud Functions logs show
// the app's real traffic consistently has one, flip this to true and
// redeploy to start rejecting everything else.
const ENFORCE_APP_CHECK = true;

interface LatLng {
    lat: number;
    lng: number;
}

function logAppCheckStatus(functionName: string, app: CallableRequest['app']): void {
    console.log(`[appCheck] ${functionName}: ${app ? 'valid token present' : 'MISSING or invalid token'}`);
}

/**
 * Throws if the calling user has exceeded their daily request budget for
 * these proxied Places calls, otherwise records this call against it.
 * Firestore-backed (no extra infra) - one doc per user per UTC day.
 */
async function enforceRateLimit(uid: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    const ref = db.collection('placesRateLimits').doc(`${uid}_${today}`);

    await db.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        const count = snapshot.exists ? ((snapshot.data()?.count as number) ?? 0) : 0;

        if (count >= DAILY_REQUEST_LIMIT) {
            throw new HttpsError('resource-exhausted', 'Daily search limit reached. Please try again tomorrow.');
        }

        tx.set(ref, { count: count + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });
}

export const placesAutocomplete = onCall(
    { secrets: [PLACES_API_KEY], region: REGION, enforceAppCheck: ENFORCE_APP_CHECK },
    async (request) => {
        logAppCheckStatus('placesAutocomplete', request.app);

        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Sign in required.');
        }

        const { query, sessionToken, near } = (request.data ?? {}) as {
            query?: string;
            sessionToken?: string;
            near?: LatLng;
        };

        if (!query || !query.trim()) {
            return { suggestions: [] };
        }

        await enforceRateLimit(request.auth.uid);

        const body: Record<string, unknown> = { input: query, sessionToken };
        if (near) {
            body.locationBias = {
                circle: { center: { latitude: near.lat, longitude: near.lng }, radius: 50000 },
            };
        }

        const response = await fetch(AUTOCOMPLETE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': PLACES_API_KEY.value(),
            },
            body: JSON.stringify(body),
        });
        const json = await response.json();

        if (!response.ok) {
            throw new HttpsError('internal', json.error?.message || `Places autocomplete failed: ${response.status}`);
        }

        const suggestions = (json.suggestions ?? [])
            .filter((suggestion: any) => suggestion.placePrediction)
            .map((suggestion: any) => {
                const prediction = suggestion.placePrediction;
                return {
                    placeId: prediction.placeId,
                    primaryText: prediction.structuredFormat?.mainText?.text || prediction.text?.text,
                    secondaryText: prediction.structuredFormat?.secondaryText?.text || '',
                };
            });

        return { suggestions };
    }
);

export const placesDetails = onCall(
    { secrets: [PLACES_API_KEY], region: REGION, enforceAppCheck: ENFORCE_APP_CHECK },
    async (request) => {
        logAppCheckStatus('placesDetails', request.app);

        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Sign in required.');
        }

        const { placeId, sessionToken } = (request.data ?? {}) as { placeId?: string; sessionToken?: string };
        if (!placeId) {
            throw new HttpsError('invalid-argument', 'placeId is required.');
        }

        await enforceRateLimit(request.auth.uid);

        const params = new URLSearchParams({ sessionToken: sessionToken ?? '' });
        const response = await fetch(`${DETAILS_URL}/${placeId}?${params.toString()}`, {
            headers: {
                'X-Goog-Api-Key': PLACES_API_KEY.value(),
                'X-Goog-FieldMask': 'displayName,location',
            },
        });
        const json = await response.json();

        if (!response.ok) {
            throw new HttpsError('internal', json.error?.message || `Place details failed: ${response.status}`);
        }

        return {
            name: json.displayName?.text ?? '',
            lat: json.location.latitude,
            lng: json.location.longitude,
        };
    }
);
