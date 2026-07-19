import { useState } from 'react';
import { journeyService } from '../services/journeyService';
import { Journey } from '../types/journey';

export const useJourneySync = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const joinJourney = async (
        journeyId: string,
        memberId: string,
        memberName: string
    ): Promise<Journey | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const journey = await journeyService.joinJourney(
                journeyId.trim().toUpperCase(),
                memberId,
                memberName
            );
            if (!journey) {
                setError('Journey not found. Please check the code.');
                return null;
            }
            return journey;
        } catch (e) {
            console.error('Join journey error:', e);
            setError('Failed to connect. Please try again.');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return { joinJourney, isLoading, error };
};
