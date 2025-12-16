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

import * as ScreenOrientation from 'expo-screen-orientation';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

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

export default function IndexScreen() {
    // Locatie Storage
    const [userLocation, setUserLocation] =
        useState<Location.LocationObject | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);


    // Scherm draaien
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

    // Vakantie Data
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

    // Bereken volgende vakantie
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

    // Haal GPS op
    useEffect(() => {
        (async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') return;

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            setUserLocation(location);
        })();
    }, []);



    if (!isLoaded) return <Text>Loading...</Text>;

    return (
        <ThemedView
            style={[
                styles.container,
                isLandscape && styles.containerLandscape,
            ]}
        >
            {/* GPS */}
            <ThemedView style={styles.mapContainer}>
                {userLocation ? (
                    <MapView
                        style={StyleSheet.absoluteFillObject}
                        initialRegion={{
                            latitude: userLocation.coords.latitude,
                            longitude: userLocation.coords.longitude,
                            latitudeDelta: 0.003,
                            longitudeDelta: 0.003,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        rotateEnabled={false}
                        pitchEnabled={false}
                        toolbarEnabled={false}
                    >
                        <Marker
                            coordinate={{
                                latitude: userLocation.coords.latitude,
                                longitude: userLocation.coords.longitude,
                            }}
                            title="Jij bent hier"
                        />
                    </MapView>

                ) : (
                    <Text>Kaart laden...</Text>
                )}
            </ThemedView>



            {/* Vakantie Info */}
            <ThemedView style={styles.infoContainer}>
                <ThemedText style={styles.title}>Eerstvolgende vakantie</ThemedText>
                <ThemedText style={styles.subtitle}>({location} geselecteerd)</ThemedText>

                {nextVacation ? (
                    <>
                        <ThemedText style={styles.date}>{nextVacation.type}</ThemedText>
                        <ThemedText style={styles.subtitle}>Van</ThemedText>
                        <ThemedText style={styles.date}>{new Date(nextVacation.start)
                            .toLocaleDateString('nl-NL', {
                                weekday: 'long',
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                            })
                            .replace(/^\w/, c => c.toUpperCase())}</ThemedText>
                        <ThemedText style={styles.subtitle}>Tot</ThemedText>
                        <ThemedText style={styles.date}>{new Date(nextVacation.end)
                            .toLocaleDateString('nl-NL', {
                                weekday: 'long',
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                            })
                            .replace(/^\w/, c => c.toUpperCase())}</ThemedText>
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
