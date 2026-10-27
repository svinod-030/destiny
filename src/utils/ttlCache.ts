// Small in-memory cache with an expiry and a size cap. Used to avoid paying for the same
// Cloud Function call twice (search suggestions, place details, routes). Not persisted:
// a fresh app launch starts empty, which keeps results from going stale across days.
export class TtlCache<V> {
    private entries = new Map<string, { value: V; expiresAt: number }>();

    constructor(private ttlMs: number, private maxEntries: number) {}

    get(key: string, now = Date.now()): V | undefined {
        const entry = this.entries.get(key);
        if (!entry) return undefined;
        if (entry.expiresAt <= now) {
            this.entries.delete(key);
            return undefined;
        }
        // Re-insert so the Map's order reflects recent use (oldest first).
        this.entries.delete(key);
        this.entries.set(key, entry);
        return entry.value;
    }

    set(key: string, value: V, now = Date.now()): void {
        this.entries.delete(key);
        this.entries.set(key, { value, expiresAt: now + this.ttlMs });
        while (this.entries.size > this.maxEntries) {
            const oldest = this.entries.keys().next().value as string;
            this.entries.delete(oldest);
        }
    }

    clear(): void {
        this.entries.clear();
    }
}
