import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SchoolYear = `${number}-${number}`;

type SchoolYearContextType = {
    schoolYear: SchoolYear;
    setSchoolYear: (year: SchoolYear) => void;
    isLoaded: boolean;
};

const SchoolYearContext = createContext<SchoolYearContextType | undefined>(
    undefined
);

const STORAGE_KEY = 'selectedSchoolYear';

// Haal schoo;jaar op
const getCurrentSchoolYear = (): SchoolYear => {
    const now = new Date();
    const year = now.getFullYear();

    return `${year}-${year + 1}`;
};

export const SchoolYearProvider = ({
                                       children,
                                   }: {
    children: React.ReactNode;
}) => {
    const [schoolYear, setSchoolYearState] = useState<SchoolYear>(
        getCurrentSchoolYear()
    );
    const [isLoaded, setIsLoaded] = useState(false);

    // Laadt het jaar
    useEffect(() => {
        const loadSchoolYear = async () => {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);

            if (stored && /^\d{4}-\d{4}$/.test(stored)) {
                setSchoolYearState(stored as SchoolYear);
            }

            setIsLoaded(true);
        };

        loadSchoolYear();
    }, []);

    // Sla jaar op
    const setSchoolYear = async (year: SchoolYear) => {
        setSchoolYearState(year);
        await AsyncStorage.setItem(STORAGE_KEY, year);
    };

    return (
        <SchoolYearContext.Provider
            value={{ schoolYear, setSchoolYear, isLoaded }}
        >
            {children}
        </SchoolYearContext.Provider>
    );
};

// Maak hook
export const useSchoolYear = () => {
    const context = useContext(SchoolYearContext);
    if (!context) {
        throw new Error(
            'useSchoolYear must be used within SchoolYearProvider'
        );
    }
    return context;
};
