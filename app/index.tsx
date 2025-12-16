import {
    StyleSheet,
    Text,
    Pressable,
    useWindowDimensions,
    ScrollView,
} from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocation } from '@/context/LocationContext';
import { useSchoolYear } from '@/context/SchoolYearContext';

import * as ScreenOrientation from 'expo-screen-orientation';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';

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
    const [userLocation, setUserLocation] =
        useState<Location.LocationObject | null>(null);

    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    const { location, setLocation, isLoaded } = useLocation();
    const { schoolYear, setSchoolYear, isLoaded: yearLoaded } = useSchoolYear();

    const [vacationData, setVacationData] = useState<Vacation[]>([]);

    // Scherm draaien
    useEffect(() => {
        ScreenOrientation.unlockAsync();
        return () =>
            ScreenOrientation.lockAsync(
                ScreenOrientation.OrientationLock.PORTRAIT_UP
            );
    }, []);

    // Vakantie Data
    useEffect(() => {
        const getVacationData = async () => {
            try {
                const request = await fetch(
                    `https://opendata.rijksoverheid.nl/v1/sources/rijksoverheid/infotypes/schoolholidays/schoolyear/${schoolYear}?output=json`
                );
                const data = await request.json();

                const vacations: Vacation[] =
                    data.content[0]?.vacations.map((v: any) => ({
                        type: v.type.trim(),
                        compulsorydates: v.compulsorydates,
                        regions: v.regions.map((r: any) => ({
                            region: r.region.trim().toLowerCase(),
                            startdate: r.startdate,
                            enddate: r.enddate,
                        })),
                    })) ?? [];

                setVacationData(vacations);
            } catch (e) {
                console.error(e);
            }
        };

        getVacationData();
    }, [schoolYear]);

    // Volgende Vakantie
    const nextVacation = useMemo(() => {
        const today = new Date();

        return vacationData
            .flatMap((vac) =>
                vac.regions
                    .filter(
                        (r) =>
                            r.region === location.toLowerCase() ||
                            r.region === 'heel nederland'
                    )
                    .map((r) => ({
                        type: vac.type,
                        start: r.startdate,
                        end: r.enddate,
                    }))
            )
            .filter((v) => new Date(v.start) >= today)
            .sort(
                (a, b) =>
                    new Date(a.start).getTime() -
                    new Date(b.start).getTime()
            )[0] ?? null;
    }, [vacationData, location]);

    // Alle Vakanties
    const vacationsForRegion = useMemo(() => {
        return vacationData
            .flatMap((vac) =>
                vac.regions
                    .filter(
                        (r) =>
                            r.region === location.toLowerCase() ||
                            r.region === 'heel nederland'
                    )
                    .map((r) => ({
                        type: vac.type,
                        start: r.startdate,
                        end: r.enddate,
                    }))
            )
            .sort(
                (a, b) =>
                    new Date(a.start).getTime() -
                    new Date(b.start).getTime()
            );
    }, [vacationData, location]);

    // GPS
    useEffect(() => {
        (async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            setUserLocation(loc);
        })();
    }, []);



    if (!isLoaded || !yearLoaded) return <Text>Loading...</Text>;

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
                    >
                        <Marker coordinate={userLocation.coords} />
                    </MapView>
                ): (
                    <ThemedView style={styles.container}>
                        <ThemedText style={styles.title}>Geen toestemming!</ThemedText>
                        <Pressable onPress={() => Linking.openSettings()}>
                            <Text style={styles.button}>Vraag toestemming</Text>
                        </Pressable>
                    </ThemedView>
                )}
            </ThemedView>

            {/* Vakantie Info */}
            <ScrollView style={styles.infoContainer}>
                <ThemedText style={styles.title}>
                    Eerstvolgende vakantie
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                    {location} • {schoolYear}
                </ThemedText>

                {nextVacation ? (
                    <>
                        <ThemedText style={styles.date}>
                            {nextVacation.type}
                        </ThemedText>
                        <ThemedText style={styles.subtitle}>
                            {new Date(nextVacation.start).toLocaleDateString(
                                'nl-NL',
                                { day: '2-digit', month: 'short' }
                            )}{' '}
                            –{' '}
                            {new Date(nextVacation.end).toLocaleDateString(
                                'nl-NL',
                                {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                }
                            )}
                        </ThemedText>
                    </>
                ) : (
                    <Text>Geen aankomende vakantie</Text>
                )}

                {/* Locatie */}
                <ThemedView style={styles.locationRow}>
                    {(['Noord', 'Midden', 'Zuid'] as const).map((l) => (
                        <Pressable
                            key={l}
                            onPress={() => setLocation(l)}
                            style={[
                                styles.locationButton,
                                location === l &&
                                styles.locationButtonActive,
                            ]}
                        >
                            <Text>{l}</Text>
                        </Pressable>
                    ))}
                </ThemedView>

                {/* Schooljaren Switchers */}
                <ThemedView style={styles.locationRow}>
                    {[0, 1, 2].map((o) => {
                        const y = `${new Date().getFullYear() + o}-${
                            new Date().getFullYear() + o + 1
                        }`;
                        return (
                            <Pressable
                                key={y}
                                onPress={() => setSchoolYear(y as any)}
                                style={[
                                    styles.locationButton,
                                    schoolYear === y &&
                                    styles.locationButtonActive,
                                ]}
                            >
                                <Text>{o === 0 ? 'Huidig jaar' : y}</Text>
                            </Pressable>
                        );
                    })}
                </ThemedView>

                {/* Alle Vakanties */}
                <ThemedText style={styles.listTitle}>
                    Alle vakanties
                </ThemedText>

                <ScrollView style={styles.listContainer}>
                    {vacationsForRegion.map((v, i) => (
                        <ThemedView key={i} style={styles.vacationItem}>
                            <ThemedText style={styles.vacationType}>
                                {v.type}
                            </ThemedText>
                            <ThemedText style={styles.vacationDates}>
                                {new Date(v.start).toLocaleDateString(
                                    'nl-NL'
                                )}{' '}
                                –{' '}
                                {new Date(v.end).toLocaleDateString(
                                    'nl-NL'
                                )}
                            </ThemedText>
                        </ThemedView>
                    ))}
                </ScrollView>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    containerLandscape: { flexDirection: 'row' },
    mapContainer: { flex: 1, borderRadius: 12, overflow: 'hidden' },
    infoContainer: { flex: 1, padding: 16 },
    title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
    subtitle: { textAlign: 'center', marginBottom: 12 },
    button: { textAlign: 'center',margin: 5, padding: 12, backgroundColor: "#9bbcf5", borderRadius: 12 },
    date: { fontSize: 20, textAlign: 'center' },

    locationRow: {
        flexDirection: 'row',
        marginTop: 12,
        borderRadius: 8,
        overflow: 'hidden',
    },
    locationButton: {
        flex: 1,
        padding: 10,
        backgroundColor: '#eee',
        alignItems: 'center',
    },
    locationButtonActive: { backgroundColor: '#9bbcf5' },

    listTitle: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    listContainer: { maxHeight: 260 },
    vacationItem: {
        backgroundColor: '#f2f2f2',
        padding: 12,
        borderRadius: 10,
        marginTop: 10,
    },
    vacationType: { fontWeight: '600' },
    vacationDates: { opacity: 0.7 },
});
