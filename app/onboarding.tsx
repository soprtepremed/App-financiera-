/**
 * Onboarding Screen — Bienvenida para nuevos usuarios
 * 3 slides animados: Bienvenida → Funcionalidades → Empezar
 * Ruta: app/onboarding.tsx
 */
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../src/store/themeStore';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    title: string;
    subtitle: string;
    features?: string[];
}

const SLIDES: Slide[] = [
    {
        icon: 'wallet-outline',
        iconColor: '#6C63FF',
        title: '¡Bienvenido a FinanzApp!',
        subtitle: 'Tu asistente financiero personal 100% privado y seguro.',
        features: [],
    },
    {
        icon: 'bar-chart-outline',
        iconColor: '#10B981',
        title: 'Controla tus finanzas',
        subtitle: 'Todo lo que necesitas para manejar tu dinero inteligentemente.',
        features: [
            '💳  Gestión de tarjetas de crédito',
            '📊  Presupuesto mensual detallado',
            '🎯  Metas de ahorro con seguimiento',
            '📈  Dashboard de gastos en tiempo real',
        ],
    },
    {
        icon: 'rocket-outline',
        iconColor: '#F59E0B',
        title: '¡Todo listo para empezar!',
        subtitle: 'En menos de 2 minutos puedes registrar tu primera tarjeta y comenzar a trackear tus gastos.',
        features: [],
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);
    const scrollRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const isLast = currentIndex === SLIDES.length - 1;

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setCurrentIndex(index);
    };

    const handleNext = () => {
        if (isLast) {
            // Marcar onboarding como completado y navegar
            router.replace('/(tabs)');
        } else {
            scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * (currentIndex + 1), animated: true });
        }
    };

    const handleSkip = () => {
        router.replace('/(tabs)');
    };

    return (
        <View style={[styles.screen, { backgroundColor: C.background.primary }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Skip */}
            {!isLast && (
                <Pressable style={styles.skipBtn} onPress={handleSkip}>
                    <Text style={[styles.skipText, { color: C.text.tertiary }]}>Omitir</Text>
                </Pressable>
            )}

            {/* Slides */}
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                scrollEventThrottle={16}
                style={styles.slidesScroll}
            >
                {SLIDES.map((slide, i) => (
                    <Animated.View
                        key={i}
                        entering={FadeIn.duration(400)}
                        style={styles.slide}
                    >
                        {/* Icono */}
                        <View style={[styles.iconContainer, { backgroundColor: `${slide.iconColor}18` }]}>
                            <Ionicons name={slide.icon} size={72} color={slide.iconColor} />
                        </View>

                        {/* Texto */}
                        <Text style={[styles.slideTitle, { color: C.text.primary }]}>
                            {slide.title}
                        </Text>
                        <Text style={[styles.slideSubtitle, { color: C.text.secondary }]}>
                            {slide.subtitle}
                        </Text>

                        {/* Features */}
                        {slide.features && slide.features.length > 0 && (
                            <View style={styles.featureList}>
                                {slide.features.map((f, fi) => (
                                    <Animated.View
                                        key={fi}
                                        entering={FadeInDown.duration(300).delay(fi * 80)}
                                        style={[styles.featureItem, { backgroundColor: C.background.elevated }]}
                                    >
                                        <Text style={[styles.featureText, { color: C.text.primary }]}>{f}</Text>
                                    </Animated.View>
                                ))}
                            </View>
                        )}
                    </Animated.View>
                ))}
            </ScrollView>

            {/* Puntos indicadores */}
            <View style={styles.dotsRow}>
                {SLIDES.map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            i === currentIndex
                                ? { backgroundColor: C.accent.primary, width: 24 }
                                : { backgroundColor: C.border.secondary, width: 8 },
                        ]}
                    />
                ))}
            </View>

            {/* Botón siguiente / empezar */}
            <Pressable
                style={[
                    styles.nextBtn,
                    { backgroundColor: C.accent.primary, ...SHADOWS.floating },
                ]}
                onPress={handleNext}
            >
                <Text style={styles.nextBtnText}>
                    {isLast ? 'Empezar ahora' : 'Siguiente'}
                </Text>
                <Ionicons
                    name={isLast ? 'checkmark-circle-outline' : 'arrow-forward-outline'}
                    size={20}
                    color="#FFFFFF"
                />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, alignItems: 'center' },
    skipBtn: {
        position: 'absolute',
        top: SPACING['4xl'],
        right: SPACING.xl,
        zIndex: 10,
        padding: SPACING.sm,
    },
    skipText: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.md },
    slidesScroll: { flex: 1 },
    slide: {
        width: SCREEN_WIDTH,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING['3xl'],
        paddingTop: SPACING['4xl'],
    },
    iconContainer: {
        width: 160, height: 160,
        borderRadius: RADIUS['3xl'],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING['2xl'],
    },
    slideTitle: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size['2xl'],
        textAlign: 'center',
        marginBottom: SPACING.md,
        letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    },
    slideSubtitle: {
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.md,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: SPACING.xl,
    },
    featureList: { width: '100%', gap: SPACING.sm },
    featureItem: {
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    featureText: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.md },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.xl,
    },
    dot: { height: 8, borderRadius: 4 },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        width: SCREEN_WIDTH - SPACING['3xl'] * 2,
        paddingVertical: SPACING.lg,
        borderRadius: RADIUS.xl,
        marginBottom: SPACING['3xl'],
    },
    nextBtnText: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md, color: '#FFFFFF' },
});
