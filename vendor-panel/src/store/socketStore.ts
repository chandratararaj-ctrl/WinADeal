import { create } from 'zustand';

interface SocketEvent {
    type: string;
    payload: any;
    timestamp: number;
}

interface SocketState {
    isConnected: boolean;
    lastEvent: SocketEvent | null;
    setConnectionStatus: (status: boolean) => void;
    setLastEvent: (event: Omit<SocketEvent, 'timestamp'> & { timestamp?: number }) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
    isConnected: false,
    lastEvent: null,
    setConnectionStatus: (status) => set({ isConnected: status }),
    setLastEvent: (event) => set({
        lastEvent: {
            ...event,
            timestamp: event.timestamp || Date.now()
        }
    }),
}));
