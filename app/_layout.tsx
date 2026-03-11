/**
 * Layout Principal - FinanzApp
 * Configura providers globales, carga de fuentes,
 * inicialización de auth y protección de rutas
 */
import { Platform, LogBox } from 'react-native';

/**
 * Suprimir warnings/errors de dependencias externas en web.
 * Ninguno afecta funcionalidad — son bugs conocidos de RN-Web/Reanimated.
 */
LogBox.ignoreLogs([
    'Invalid DOM property',
    '"shadow*" style props are deprecated',
    'props.pointerEvents is deprecated',
    'Listening to push token changes',
]);

if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const origError = console.error;
    const origWarn = console.warn;
    const suppressPatterns = ['transform-origin', 'shadow*', 'pointerEvents', 'push token'];
    console.error = (...args: any[]) => {
        if (typeof args[0] === 'string' && suppressPatterns.some(p => args[0].includes(p))) return;
        origError.apply(console, args);
    };
    console.warn = (...args: any[]) => {
        if (typeof args[0] === 'string' && suppressPatterns.some(p => args[0].includes(p))) return;
        origWarn.apply(console, args);
    };
}

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

    // ── Re-check post-OAuth: parsear hash fragment (#access_token=...) ──
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const hash = window.location.hash;
        if (!hash || !hash.includes('access_token')) return;

        // Parsear los tokens directamente del hash
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken || !refreshToken) return;

        const restoreSession = async () => {
            try {
                // Establecer la sesión con los tokens del hash
                const { data, error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (error) {
                    console.error('Error restaurando sesión OAuth:', error.message);
                    return;
                }

                if (data.session) {
                    setSession(data.session);

                    // Cargar perfil del usuario
                    const { fetchProfile } = useAuthStore.getState();
                    await fetchProfile();
                }

                // Limpiar el hash de la URL para que no se vuelva a procesar
                window.history.replaceState(null, '', window.location.pathname);
            } catch (err) {
                console.error('Error en callback OAuth:', err);
            }
        };

        restoreSession();
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

    // ── Registro del Service Worker PWA (solo en web / Vercel) ──
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator)) return;

        const registerSW = async () => {
            try {
                const reg = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    updateViaCache: 'none',
                });
                console.log('[PWA] Service Worker registrado:', reg.scope);
            } catch (err) {
                console.warn('[PWA] Error al registrar Service Worker:', err);
            }
        };

        // Registrar cuando el DOM esté listo
        if (document.readyState === 'complete') {
            registerSW();
        } else {
            window.addEventListener('load', registerSW, { once: true });
        }
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
