export interface Destination {
    name: string;
    lat: number;
    lng: number;
}

export interface JourneyMember {
    id: string;
    name: string;
    color: string;
    isCreator: boolean;
    lat: number | null;
    lng: number | null;
    heading?: number | null;
    updatedAt: string | null;
}

export interface Journey {
    id: string;
    destination: Destination;
    creatorId: string;
    createdAt: string;
    lastUpdatedAt: string;
    members: Record<string, JourneyMember>;
}
