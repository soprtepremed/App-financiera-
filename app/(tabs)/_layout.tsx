/**
 * Tabs Layout - Navegación principal con 5 tabs
 * Incluye botón flotante de cambio de tema (🌙 / ☀️) visible en toda la app.
 */
import { Tabs } from 'expo-router';
import { View, Pressable, StyleSheet, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TYPOGRAPHY, SPACING, SHADOWS, RADIUS } from '../../src/constants/theme';
import { useThemeStore } from '../../src/store/themeStore';
import { getThemeColors } from '../../src/constants/theme';

/** Ancho máximo del tab bar en web para que 5 tabs no se compriman */
const TAB_BAR_MAX_WIDTH = 600;

/** Ícono de tab con indicador activo */
function TabIcon({ name, focusedName, focused, isDark }: {
    name: keyof typeof Ionicons.glyphMap;
    focusedName: keyof typeof Ionicons.glyphMap;
    focused: boolean;
    isDark: boolean;
}) {
    const C = getThemeColors(isDark);
    return (
        <View style={[
            styles.iconContainer,
            focused && { backgroundColor: C.iconContainer.primary, borderRadius: RADIUS.lg },
        ]}>
            <Ionicons
                name={focused ? focusedName : name}
                size={focused ? 24 : 22}
                color={focused ? C.accent.primary : C.text.tertiary}
            />
        </View>
    );
}

/**
 * Botón flotante de cambio de tema — visible en TODA la app.
 * Posición: esquina superior derecha, sobre el contenido.
 */
function ThemeToggleButton({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
    const C = getThemeColors(isDark);

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onToggle();
    };

    return (
        <Pressable
            onPress={handlePress}
            style={({ pressed }) => [
                styles.themeBtn,
                {
                    backgroundColor: isDark
                        ? 'rgba(255,255,255,0.10)'
                        : 'rgba(15, 23, 42, 0.08)',
                    borderColor: isDark
                        ? 'rgba(255,255,255,0.15)'
                        : 'rgba(15, 23, 42, 0.12)',
                    opacity: pressed ? 0.75 : 1,
                    transform: [{ scale: pressed ? 0.92 : 1 }],
                },
            ]}
            accessibilityLabel={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
            {/* Ícono luna/sol */}
            <Text style={styles.themeBtnIcon}>
                {isDark ? '☀️' : '🌙'}
            </Text>
        </Pressable>
    );
}

export default function TabsLayout() {
    const { isDark, toggle } = useThemeStore();
    const C = getThemeColors(isDark);

    return (
        <View style={[styles.root, { backgroundColor: C.background.primary }]}>
            {/* Navegación principal */}
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: [
                        styles.tabBar,
                        {
                            backgroundColor: isDark
                                ? 'rgba(15, 23, 42, 0.92)'
                                : 'rgba(255, 255, 255, 0.92)',
                            borderTopColor: C.border.primary,
                            // En web: centrar el tab bar con ancho limitado
                            ...(Platform.OS === 'web' && {
                                left: '50%',
                                transform: [{ translateX: '-50%' }] as any,
                                maxWidth: TAB_BAR_MAX_WIDTH,
                                width: '100%',
                                borderTopLeftRadius: RADIUS['3xl'],
                                borderTopRightRadius: RADIUS['3xl'],
                            }),
                        },
                    ],
                    tabBarActiveTintColor: C.accent.primary,
                    tabBarInactiveTintColor: C.text.tertiary,
                    tabBarLabelStyle: [
                        styles.tabLabel,
                        { color: C.text.tertiary },
                    ],
                    tabBarHideOnKeyboard: true,
                }}
                screenListeners={{
                    tabPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Inicio',
                        tabBarIcon: ({ focused }) => (
                            <TabIcon name="home-outline" focusedName="home" focused={focused} isDark={isDark} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="cards"
                    options={{
                        title: 'Tarjetas',
                        tabBarIcon: ({ focused }) => (
                            <TabIcon name="card-outline" focusedName="card" focused={focused} isDark={isDark} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="budget"
                    options={{
                        title: 'Presupuesto',
                        tabBarIcon: ({ focused }) => (
                            <TabIcon name="pie-chart-outline" focusedName="pie-chart" focused={focused} isDark={isDark} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="goals"
                    options={{
                        title: 'Metas',
                        tabBarIcon: ({ focused }) => (
                            <TabIcon name="flag-outline" focusedName="flag" focused={focused} isDark={isDark} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Perfil',
                        tabBarIcon: ({ focused }) => (
                            <TabIcon name="person-outline" focusedName="person" focused={focused} isDark={isDark} />
                        ),
                    }}
                />
            </Tabs>

            {/* Botón flotante de tema — siempre visible arriba a la derecha */}
            <ThemeToggleButton isDark={isDark} onToggle={toggle} />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    tabBar: {
        borderTopWidth: 1,
        height: Platform.OS === 'ios' ? 90 : 70,
        paddingBottom: Platform.OS === 'ios' ? 24 : 10,
        paddingTop: 10,
        // Reducir padding horizontal para que 5 tabs quepan sin cortarse
        paddingHorizontal: Platform.OS === 'web' ? 4 : 16,
        borderTopLeftRadius: RADIUS['3xl'],
        borderTopRightRadius: RADIUS['3xl'],
        ...SHADOWS.lg,
    },
    tabLabel: {
        fontFamily: TYPOGRAPHY.family.bold,
        // Reducir tamaño y espaciado para evitar overflow en pantallas pequeñas
        fontSize: 9,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        marginTop: 2,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 32,
    },
    /** Botón flotante fijo arriba a la derecha */
    themeBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 56 : 16,
        right: 16,
        width: 42,
        height: 42,
        borderRadius: RADIUS.full,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        ...SHADOWS.md,
    },
    themeBtnIcon: {
        fontSize: 20,
        lineHeight: 24,
    },
});
