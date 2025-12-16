import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Location = 'Noord' | 'Midden' | 'Zuid';

type LocationContextType = {
    location: Location;
    setLocation: (location: Location) => void;
    isLoaded: boolean;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = 'selectedLocation';

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
    const [location, setLocationState] = useState<Location>('Noord');
    const [isLoaded, setIsLoaded] = useState(false);

    /* ===== Laad 1x bij app start ===== */
    useEffect(() => {
        const loadLocation = async () => {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored === 'Noord' || stored === 'Midden' || stored === 'Zuid') {
                setLocationState(stored);
            }
            setIsLoaded(true);
        };

        loadLocation();
    }, []);

    /* ===== Globale setter ===== */
    const setLocation = async (newLocation: Location) => {
        setLocationState(newLocation);
        await AsyncStorage.setItem(STORAGE_KEY, newLocation);
    };

    return (
        <LocationContext.Provider value={{ location, setLocation, isLoaded }}>
            {children}
        </LocationContext.Provider>
    );
};

/* ===== Custom hook ===== */
export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within LocationProvider');
    }
    return context;
};
