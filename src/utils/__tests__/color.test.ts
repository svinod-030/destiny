import { getInitials } from '../color';

describe('getInitials', () => {
    test('uses one letter from each of the first two words for multi-word names', () => {
        expect(getInitials('John Doe')).toBe('JD');
        expect(getInitials('Mary Jane Watson')).toBe('MJ');
    });

    test('uses the first two letters for a single-word name', () => {
        expect(getInitials('Madonna')).toBe('MA');
        expect(getInitials('Al')).toBe('AL');
        expect(getInitials('A')).toBe('A');
    });

    test('is case-insensitive and always returns uppercase', () => {
        expect(getInitials('john doe')).toBe('JD');
        expect(getInitials('madonna')).toBe('MA');
    });

    test('ignores extra surrounding/inner whitespace', () => {
        expect(getInitials('  John   Doe  ')).toBe('JD');
    });
});
