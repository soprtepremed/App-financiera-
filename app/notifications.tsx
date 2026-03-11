/**
 * Notifications Screen — Gestión de recordatorios de pago
 * Programar alertas: días antes del corte y día de pago por tarjeta.
 * Ruta: app/notifications.tsx
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Switch,
    Alert,
    Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../src/components/ui';
import { useNotifications, requestNotificationPermission } from '../src/hooks/useNotifications';
import { useCards } from '../src/hooks/useCards';
import { useThemeStore } from '../src/store/themeStore';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS } from '../src/constants/theme';
import { safeGoBack } from '../src/utils/navigation';
import * as SecureStore from 'expo-secure-store';

const NOTIF_ENABLED_KEY = 'finanzapp_notifications_enabled';

export default function NotificationsScreen() {
    const router = useRouter();
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);
    const { data: cards = [] } = useCards();
    const { initNotifications, cancelAll, getScheduled } = useNotifications();

    const [enabled, setEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [scheduledCount, setScheduledCount] = useState(0);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    // Cargar estado guardado
    useEffect(() => {
        (async () => {
            try {
                if (Platform.OS === 'web') {
                    // SecureStore no funciona en web, usar localStorage
                    const saved = typeof window !== 'undefined'
                        ? localStorage.getItem(NOTIF_ENABLED_KEY)
                        : null;
                    setEnabled(saved === 'true');
                    setScheduledCount(0);
                } else {
                    const saved = await SecureStore.getItemAsync(NOTIF_ENABLED_KEY);
                    setEnabled(saved === 'true');
                    const scheduled = await getScheduled();
                    setScheduledCount(scheduled.length);
                }
            } catch {
                // Fallback seguro
                setEnabled(false);
                setScheduledCount(0);
            }
        })();
    }, []);

    const isWeb = Platform.OS === 'web';

    const handleToggle = async (value: boolean) => {
        if (isWeb) return; // En web no hay notificaciones push

        setIsLoading(true);

        if (value) {
            const result = await initNotifications();
            if (!result.success) {
                Alert.alert(
                    'Permiso denegado',
                    'Para recibir recordatorios, ve a Ajustes → FinanzApp y activa las notificaciones.',
                    [{ text: 'OK' }]
                );
                setIsLoading(false);
                return;
            }
            setEnabled(true);
            setScheduledCount(result.count);
            await SecureStore.setItemAsync(NOTIF_ENABLED_KEY, 'true');
            Alert.alert(
                '✅ Recordatorios activados',
                `Se programaron ${result.count} recordatorio${result.count !== 1 ? 's' : ''} de pago y corte.`
            );
        } else {
            await cancelAll();
            setEnabled(false);
            setScheduledCount(0);
            await SecureStore.setItemAsync(NOTIF_ENABLED_KEY, 'false');
        }

        setIsLoading(false);
    };

    const handleReprogramar = async () => {
        if (!enabled) return;
        setIsLoading(true);
        const result = await initNotifications();
        setScheduledCount(result.count);
        setIsLoading(false);
        Alert.alert('✅ Re-programado', `${result.count} recordatorios actualizados.`);
    };

    return (
        <View style={[styles.screen, { backgroundColor: C.background.primary }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => safeGoBack(router)} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={C.text.primary} />
                </Pressable>
                <Text style={[styles.title, { color: C.text.primary }]}>🔔 Notificaciones</Text>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Master switch */}
                <Animated.View entering={FadeInDown.duration(400)}>
                    <GlassCard variant="elevated" padding="xl" style={styles.card}>
                        <View style={styles.switchRow}>
                            <View style={styles.switchLeft}>
                                <View style={[styles.switchIcon, { backgroundColor: `${C.accent.primary}20` }]}>
                                    <Ionicons name="notifications-outline" size={24} color={C.accent.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.switchTitle, { color: C.text.primary }]}>
                                        Recordatorios de pago
                                    </Text>
                                    <Text style={[styles.switchSub, { color: C.text.tertiary }]}>
                                        {enabled
                                            ? `${scheduledCount} recordatorio${scheduledCount !== 1 ? 's' : ''} activo${scheduledCount !== 1 ? 's' : ''}`
                                            : 'Desactivados'}
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={enabled}
                                onValueChange={handleToggle}
                                disabled={isLoading || isWeb}
                                trackColor={{ false: C.background.tertiary, true: C.accent.primary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                        {isWeb && (
                            <Text style={[styles.webSwitchNote, { color: C.accent.warning }]}>
                                ⚠️ Solo disponible en la app móvil (iOS / Android)
                            </Text>
                        )}
                    </GlassCard>
                </Animated.View>

                {/* Info sobre los recordatorios */}
                <Animated.View entering={FadeInDown.duration(400).delay(80)}>
                    <GlassCard variant="default" padding="lg" style={styles.card}>
                        <Text style={[styles.sectionTitle, { color: C.text.primary }]}>
                            ¿Qué recibirás?
                        </Text>
                        {[
                            {
                                icon: 'card-outline' as const,
                                color: C.accent.danger,
                                title: '3 días antes del pago',
                                sub: 'Recordatorio de vencimiento próximo por cada tarjeta con saldo',
                            },
                            {
                                icon: 'cut-outline' as const,
                                color: C.accent.warning,
                                title: '2 días antes del corte',
                                sub: 'Aviso de cierre de ciclo de facturación',
                            },
                        ].map((item, i) => (
                            <View key={i} style={[styles.infoRow, { borderTopColor: i > 0 ? C.border.secondary : 'transparent' }]}>
                                <View style={[styles.infoIcon, { backgroundColor: `${item.color}18` }]}>
                                    <Ionicons name={item.icon} size={20} color={item.color} />
                                </View>
                                <View style={styles.infoText}>
                                    <Text style={[styles.infoTitle, { color: C.text.primary }]}>{item.title}</Text>
                                    <Text style={[styles.infoSub, { color: C.text.tertiary }]}>{item.sub}</Text>
                                </View>
                            </View>
                        ))}
                    </GlassCard>
                </Animated.View>

                {/* Tarjetas con recordatorio */}
                {enabled && cards.length > 0 && (
                    <Animated.View entering={FadeInDown.duration(400).delay(160)}>
                        <GlassCard variant="default" padding="lg" style={styles.card}>
                            <View style={styles.cardHeaderRow}>
                                <Text style={[styles.sectionTitle, { color: C.text.primary }]}>
                                    Tarjetas monitoreadas
                                </Text>
                                <Pressable onPress={handleReprogramar} disabled={isLoading}>
                                    <Text style={[styles.reprogramText, { color: C.accent.primary }]}>
                                        {isLoading ? '...' : 'Re-programar'}
                                    </Text>
                                </Pressable>
                            </View>
                            {cards.map((card) => (
                                <View
                                    key={card.id}
                                    style={[styles.monitorRow, { borderTopColor: C.border.secondary }]}
                                >
                                    <View style={[styles.monitorDot, { backgroundColor: card.card_color ?? C.accent.primary }]} />
                                    <View style={styles.monitorInfo}>
                                        <Text style={[styles.monitorName, { color: C.text.primary }]}>
                                            {card.card_alias ?? card.bank_name} •••• {card.last_four_digits}
                                        </Text>
                                        <Text style={[styles.monitorSub, { color: C.text.tertiary }]}>
                                            Pago: día {card.payment_due_day} · Corte: día {card.cut_off_day}
                                        </Text>
                                    </View>
                                    {card.current_balance > 0 ? (
                                        <Ionicons name="checkmark-circle" size={18} color={C.accent.success} />
                                    ) : (
                                        <Text style={[styles.noDebt, { color: C.text.tertiary }]}>Sin saldo</Text>
                                    )}
                                </View>
                            ))}
                        </GlassCard>
                    </Animated.View>
                )}

                {/* Nota sobre plataformas */}
                {Platform.OS === 'web' && (
                    <Animated.View entering={FadeInDown.duration(400).delay(220)}>
                        <GlassCard variant="default" padding="lg" style={styles.card}>
                            <View style={styles.webNote}>
                                <Ionicons name="information-circle-outline" size={20} color={C.accent.info} />
                                <Text style={[styles.webNoteText, { color: C.text.secondary }]}>
                                    Las notificaciones push requieren un dispositivo físico (iOS/Android). No están disponibles en la versión web.
                                </Text>
                            </View>
                        </GlassCard>
                    </Animated.View>
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: SPACING['4xl'], paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg,
    },
    backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
    title: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xl },
    card: { marginBottom: SPACING.md },
    // Switch
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    switchLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
    switchIcon: { width: 48, height: 48, borderRadius: RADIUS.xl, justifyContent: 'center', alignItems: 'center' },
    switchTitle: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md },
    switchSub: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.sm, marginTop: 2 },
    // Info
    sectionTitle: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.lg, marginBottom: SPACING.md },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 1 },
    infoIcon: { width: 40, height: 40, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
    infoText: { flex: 1 },
    infoTitle: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.sm },
    infoSub: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs, marginTop: 2 },
    // Cards list
    cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
    reprogramText: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm },
    monitorRow: {
        flexDirection: 'row', alignItems: 'center', paddingTop: SPACING.sm,
        marginTop: SPACING.sm, borderTopWidth: 1, gap: SPACING.sm,
    },
    monitorDot: { width: 10, height: 10, borderRadius: 5 },
    monitorInfo: { flex: 1 },
    monitorName: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm },
    monitorSub: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs, marginTop: 2 },
    noDebt: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs },
    // Web note
    webNote: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
    webNoteText: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.sm, flex: 1, lineHeight: 20 },
    webSwitchNote: {
        fontFamily: TYPOGRAPHY.family.medium,
        fontSize: TYPOGRAPHY.size.xs,
        marginTop: SPACING.sm,
        textAlign: 'center',
    },
    bottomSpacer: { height: 20 },
});
