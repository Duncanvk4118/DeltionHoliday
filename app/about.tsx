import {StyleSheet, useWindowDimensions} from 'react-native';
import { useEffect } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import * as ScreenOrientation from 'expo-screen-orientation';
import {Image} from "expo-image";


export default function AboutScreen() {

    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    // Scherm draaien
    useEffect(() => {
        ScreenOrientation.unlockAsync();
        return () =>
            ScreenOrientation.lockAsync(
                ScreenOrientation.OrientationLock.PORTRAIT_UP
            );
    }, []);

    return (
        <ThemedView
            style={[
                styles.container,
                isLandscape && styles.containerLandscape,
            ]}
        >
            {!isLandscape && (<ThemedText style={styles.title}>Over mij</ThemedText>)}
            <ThemedView style={styles.mapContainer}>
                <Image
                    source={require('@/assets/images/Me.jpg')}
                    style={styles.seasonImage}
                />


            </ThemedView>
            <ThemedView style={[
                styles.container,
                isLandscape && styles.containerLandscape2,
            ]}>
            <ThemedText style={styles.subtitle}>Duncan van Keulen</ThemedText>
            <ThemedText style={styles.subtitle}>18 jaar</ThemedText>
            <ThemedText style={styles.subtitle}>Genemuiden</ThemedText>
            </ThemedView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    containerLandscape: { flexDirection: 'row' },
    containerLandscape2: { flexDirection: 'col' },
    mapContainer: {
        width: 400,
        height: 400,
        flex: 1,
        borderRadius: 12,
        backgroundColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
    subtitle: { textAlign: 'center', marginBottom: 12 },
    seasonImage: {
        width: 500,
        height: 500,
        borderRadius: 12,
    },
});
