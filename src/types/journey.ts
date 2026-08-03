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
    hasArrived?: boolean;
    arrivedAt?: string | null;
    updatedAt: string | null;
}

export interface Journey {
    id: string;
    destination: Destination;
    // Intermediate stops along the way, ordered farthest-from-destination first
    // (i.e. the order they'd naturally be visited in before the final destination).
    stops: Destination[];
    creatorId: string;
    createdAt: string;
    lastUpdatedAt: string;
    members: Record<string, JourneyMember>;
}
