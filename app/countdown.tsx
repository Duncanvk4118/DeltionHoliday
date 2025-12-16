import {
    StyleSheet,
    Text,
    Pressable,
    useWindowDimensions,
} from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocation } from '@/context/LocationContext';

const seasonImages = {
    Zomer: require('@/assets/images/Zomer.jpg'),
    Lente: require('@/assets/images/Lente.jpg'),
    Herfst: require('@/assets/images/Herfst.jpg'),
    Winter: require('@/assets/images/Winter.jpg'),
};

import * as ScreenOrientation from 'expo-screen-orientation';
import {Image} from "expo-image";

type RegionInfo = {
    region: string;
    startdate: string;
    enddate: string;
};

type Vacation = {
    type: string;
    regions: RegionInfo[];
    compulsorydates: string;
};

export default function CountdownScreen() {


    // Rotatie van scherm
    useEffect(() => {
        ScreenOrientation.unlockAsync();

        return () => {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        };
    }, []);
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    const { location, setLocation, isLoaded } = useLocation();
    const [vacationData, setVacationData] = useState<Vacation[]>([]);
    const [countdown, setCountdown] = useState<string>('');

    // Haal vakantie data op
    useEffect(() => {
        const getVacationData = async () => {
            try {
                const request = await fetch(
                    'https://opendata.rijksoverheid.nl/v1/sources/rijksoverheid/infotypes/schoolholidays/schoolyear/2025-2026?output=json'
                );
                const data = await request.json();
                const vacations: Vacation[] = data.content[0]?.vacations.map((v: any) => ({
                    type: v.type.trim(),
                    compulsorydates: v.compulsorydates,
                    regions: v.regions.map((r: any) => ({
                        region: r.region.trim().toLowerCase(),
                        startdate: r.startdate,
                        enddate: r.enddate,
                    })),
                })) ?? [];
                setVacationData(vacations);
            } catch (error) {
                console.error('Failed to load vacation data:', error);
            }
        };
        getVacationData();
    }, []);

    // Bereken tijden van aankomende vakantie
    const nextVacation = useMemo(() => {
        if (!vacationData.length) return null;
        const today = new Date();

        const filtered: { type: string; start: string; end: string }[] = [];

        vacationData.forEach((vac) => {
            vac.regions.forEach((r) => {
                filtered.push({ type: vac.type, start: r.startdate, end: r.enddate });
            });
        });

        const upcoming = filtered
            .filter((v) => new Date(v.start) >= today)
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        return upcoming[0] ?? null;
    }, [vacationData]);

    // Countdown berekenen
    useEffect(() => {
        if (!nextVacation) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const startTime = new Date(nextVacation.start).getTime();
            const diff = startTime - now;

            if (diff <= 0) {
                setCountdown('De vakantie is begonnen!');
                clearInterval(interval);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setCountdown(`${days} dagen, ${hours} uur, ${minutes} min, ${seconds} sec`);
        }, 1000);

        return () => clearInterval(interval);
    }, [nextVacation]);

    // Check Seizoen
    const calculateSeason = () => {
        const month = new Date().getMonth();

        // Maart-Mei
        if (month >= 2 && month <= 4) return 'Lente';
        // Jun-Aug
        if (month >= 5 && month <= 7) return 'Zomer';
        // Sept-Nov
        if (month >= 8 && month <= 10) return 'Herfst';
        // Dec-Feb
        return 'Winter';
    };

    const currentSeason = calculateSeason();


    if (!isLoaded) return <Text>Loading...</Text>;

    return (
        <ThemedView
            style={[
                styles.container,
                isLandscape && styles.containerLandscape,
            ]}
        >
            {/* Seizoens Foto's */}
            <ThemedView style={styles.mapContainer}>
                <Image
                    source={seasonImages[currentSeason]}
                    style={styles.seasonImage}
                />
            </ThemedView>


            {/* Vakantie Info */}
            <ThemedView style={styles.infoContainer}>
                <ThemedText style={styles.title}>Eerstvolgende vakantie</ThemedText>
                <ThemedText style={styles.subtitle}>({location} geselecteerd)</ThemedText>

                {nextVacation ? (
                    <>
                        <ThemedText style={styles.date}>{nextVacation.type}</ThemedText>
                        <ThemedText style={styles.date}>{countdown}</ThemedText>
                    </>
                ) : (
                    <Text>Geen aankomende vakanties gevonden</Text>
                )}

                {/* Locatie Switchers */}
                <ThemedView style={styles.locationRow}>
                    {(['Noord', 'Midden', 'Zuid'] as const).map((item) => (
                        <Pressable
                            key={item}
                            onPress={() => setLocation(item)}
                            style={[
                                styles.locationButton,
                                location === item && styles.locationButtonActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.locationText,
                                    location === item && styles.locationTextActive,
                                ]}
                            >
                                {item}
                            </Text>
                        </Pressable>
                    ))}
                </ThemedView>
            </ThemedView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    containerLandscape: { flexDirection: 'row' },
    mapContainer: {
        flex: 1,
        borderRadius: 12,
        backgroundColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    seasonImage: {
        width: 410,
        height: 410,
        borderRadius: 12,
    },
    mapText: { fontSize: 18 },
    infoContainer: { flex: 1, padding: 16, justifyContent: 'center' },
    title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
    subtitle: { textAlign: 'center', marginBottom: 16 },
    date: { fontSize: 20, textAlign: 'center', marginVertical: 4 },
    locationRow: { flexDirection: 'row', marginTop: 20, borderRadius: 8, overflow: 'hidden' },
    locationButton: { flex: 1, paddingVertical: 12, backgroundColor: '#eee', alignItems: 'center' },
    locationButtonActive: { backgroundColor: '#9bbcf5' },
    locationText: { fontSize: 16 },
    locationTextActive: { fontWeight: 'bold' },
});
