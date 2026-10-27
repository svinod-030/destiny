import { TtlCache } from '../ttlCache';

describe('TtlCache', () => {
    it('returns a stored value until it expires', () => {
        const cache = new TtlCache<string>(1000, 10);
        cache.set('a', 'x', 0);
        expect(cache.get('a', 999)).toBe('x');
        expect(cache.get('a', 1000)).toBeUndefined();
    });

    it('evicts the least recently used entry past the size cap', () => {
        const cache = new TtlCache<number>(1000, 2);
        cache.set('a', 1, 0);
        cache.set('b', 2, 0);
        cache.get('a', 1); // a is now the most recently used
        cache.set('c', 3, 2);
        expect(cache.get('b', 3)).toBeUndefined();
        expect(cache.get('a', 3)).toBe(1);
        expect(cache.get('c', 3)).toBe(3);
    });

    it('overwriting a key refreshes its expiry', () => {
        const cache = new TtlCache<string>(1000, 10);
        cache.set('a', 'old', 0);
        cache.set('a', 'new', 900);
        expect(cache.get('a', 1500)).toBe('new');
    });
});
