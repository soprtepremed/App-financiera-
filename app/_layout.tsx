/**
 * Layout Principal - FinanzApp
 * Configura providers globales, carga de fuentes,
 * inicialización de auth y protección de rutas
 */


import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    useFonts,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
} from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore } from '../src/store/themeStore';
import { supabase } from '../src/services/supabase';
import { DARK_COLORS } from '../src/constants/theme';

/** Cliente de React Query para data fetching */
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutos
            retry: 2,
        },
    },
});

/**
 * Protección de rutas basada en estado de autenticación.
 * Si DEV_BYPASS = true, salta la verificación y va directo a los tabs.
 */
function useProtectedRoute() {
    const { session, isInitialized, setSession } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    // ── Re-check post-OAuth ──
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
            const timer = setTimeout(async () => {
                const { data } = await supabase.auth.getSession();
                if (data.session) setSession(data.session);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, []);

    // ── Protección de rutas ──
    useEffect(() => {
        if (!isInitialized) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!session && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (session && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [session, isInitialized, segments]);
}

/** Pantalla de carga mientras se inicializa la app */
function LoadingScreen() {
    return (
        <View style={styles.loading}>
            <ActivityIndicator size="large" color={DARK_COLORS.accent.primary} />
        </View>
    );
}

export default function RootLayout() {
    const { initialize, isInitialized } = useAuthStore();
    const { loadTheme } = useThemeStore();

    // Cargar fuentes Inter
    const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
    });

    // Inicializar auth + cargar preferencia de tema guardada
    useEffect(() => {
        initialize();
        loadTheme(); // Carga dark/light desde SecureStore
    }, []);

    // Protección de rutas
    useProtectedRoute();

    // Mostrar loading mientras carga fuentes y auth
    if (!fontsLoaded || !isInitialized) {
        return <LoadingScreen />;
    }

    return (
        <GestureHandlerRootView style={styles.root}>
            <QueryClientProvider client={queryClient}>
                <Slot />
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: DARK_COLORS.background.primary,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: DARK_COLORS.background.primary,
    },
});
