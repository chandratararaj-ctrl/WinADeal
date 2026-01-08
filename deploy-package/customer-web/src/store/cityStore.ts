import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CityState {
    selectedCity: string;
    availableCities: string[];
    setSelectedCity: (city: string) => void;
    setAvailableCities: (cities: string[]) => void;
}

export const useCityStore = create<CityState>()(
    persist(
        (set) => ({
            selectedCity: '', // Will be set from API or user selection
            availableCities: [],
            setSelectedCity: (city) => set({ selectedCity: city }),
            setAvailableCities: (cities) => set({ availableCities: cities }),
        }),
        {
            name: 'city-storage',
        }
    )
);
