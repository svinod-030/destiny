import { JourneyMember } from '../types/journey';
import { HistoryMember } from '../store/useJourneyHistoryStore';

export const toHistoryMembers = (members: Record<string, JourneyMember>): HistoryMember[] =>
    Object.values(members).map((m) => ({
        id: m.id,
        name: m.name,
        color: m.color,
        isCreator: m.isCreator,
    }));
