const PALETTE = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981',
    '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E',
];

// Deterministic so the same member always renders in the same color across devices.
export const colorForId = (id: string): string => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash << 5) - hash + id.charCodeAt(i);
        hash |= 0;
    }
    return PALETTE[Math.abs(hash) % PALETTE.length];
};

// Two-character initials for avatar markers: one letter from each of the first
// two words if the name has multiple words, otherwise the first two letters
// of the single word.
export const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
        return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return (words[0] ?? '').slice(0, 2).toUpperCase();
};
