/**
 * Dashboard / Home Screen - Pantalla principal
 * Vista consolidada con balance, tarjetas, resumen mensual y próximos pagos
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { useCards, getDaysUntil, getCardStatus } from '../../src/hooks/useCards';
import { useBudgetSummary } from '../../src/hooks/useBudget';
import { GlassCard, AnimatedCounter, Badge } from '../../src/components/ui';
import { getGreeting, getFirstName, formatCurrency, formatCardNumber } from '../../src/utils/formatters';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { AddExpenseModal } from '../../src/components/expenses/AddExpenseModal';

export default function DashboardScreen() {
    const { profile } = useAuthStore();
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);
    const router = useRouter();
    const { data: cards = [], refetch: refetchCards, isRefetching: isRefetchingCards } = useCards();
    const { data: summary, refetch: refetchSummary, isRefetching: isRefetchingSummary } = useBudgetSummary();
    const [expenseModalVisible, setExpenseModalVisible] = useState(false);

    const isRefetching = isRefetchingCards || isRefetchingSummary;

    const onRefresh = React.useCallback(async () => {
        refetchCards();
        refetchSummary();
    }, [refetchCards, refetchSummary]);

    const greeting = getGreeting();
    const firstName = getFirstName(profile?.full_name ?? null);

    // Calcular balance total (suma de saldos de tarjetas = lo que debes)
    const totalBalance = cards.reduce((sum, c) => sum + c.current_balance, 0);
    // Límite total y crédito disponible
    const totalLimit = cards.reduce((sum, c) => sum + c.credit_limit, 0);
    const totalAvailable = totalLimit - totalBalance;
    const usagePercent = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;

    // Próximos pagos (tarjetas con menos de 10 días para pago)
    const upcomingPayments = cards
        .filter(c => c.current_balance > 0)
        .map(c => ({
            ...c,
            daysToPayment: getDaysUntil(c.payment_due_day),
            status: getCardStatus(c),
        }))
        .filter(c => c.daysToPayment <= 10)
        .sort((a, b) => a.daysToPayment - b.daysToPayment);

    return (
        <View style={[styles.screen, { backgroundColor: C.background.primary }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={onRefresh}
                        tintColor={C.accent.primary}
                        colors={[C.accent.primary]}
                    />
                }
            >
                {/* ── Header con saludo ── */}
                <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: C.text.secondary }]}>{greeting},</Text>
                        <Text style={[styles.userName, { color: C.text.primary }]}>{firstName} 👋</Text>
                    </View>
                    <Pressable style={[styles.notificationBadge, { backgroundColor: C.background.card }]}>
                        <Ionicons name="notifications-outline" size={22} color={C.text.secondary} />
                        {upcomingPayments.length > 0 && (
                            <View style={[styles.notifDot, { backgroundColor: C.accent.danger }]} />
                        )}
                    </Pressable>
                </Animated.View>

                {/* ── Balance Total ── */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)}>
                    <GlassCard variant="accent" padding="2xl" style={styles.balanceCard}>
                        <Text style={[styles.balanceLabel, { color: C.text.secondary }]}>Deuda Total en Tarjetas</Text>
                        <AnimatedCounter
                            value={totalBalance}
                            size="hero"
                            color={C.text.primary}
                        />

                        {/* Info complementaria: crédito disponible y límite */}
                        {cards.length > 0 && (
                            <View style={styles.balanceDetails}>
                                <View style={styles.balanceDetailItem}>
                                    <Text style={[styles.balanceDetailLabel, { color: C.text.tertiary }]}>Disponible</Text>
                                    <Text style={[styles.balanceDetailValue, { color: C.accent.success }]}>
                                        {formatCurrency(totalAvailable, false)}
                                    </Text>
                                </View>
                                <View style={[styles.balanceDetailDivider, { backgroundColor: C.border.secondary }]} />
                                <View style={styles.balanceDetailItem}>
                                    <Text style={[styles.balanceDetailLabel, { color: C.text.tertiary }]}>Límite total</Text>
                                    <Text style={[styles.balanceDetailValue, { color: C.text.secondary }]}>
                                        {formatCurrency(totalLimit, false)}
                                    </Text>
                                </View>
                                <View style={[styles.balanceDetailDivider, { backgroundColor: C.border.secondary }]} />
                                <View style={styles.balanceDetailItem}>
                                    <Text style={[styles.balanceDetailLabel, { color: C.text.tertiary }]}>Uso</Text>
                                    <Text style={[styles.balanceDetailValue, { color: usagePercent > 70 ? C.accent.danger : usagePercent > 40 ? C.accent.warning : C.accent.success }]}>
                                        {usagePercent}%
                                    </Text>
                                </View>
                            </View>
                        )}

                        {summary && summary.totalIncome > 0 && (
                            <View style={styles.balanceChange}>
                                <Badge
                                    text={`Presupuesto disponible: ${formatCurrency(summary.available)}`}
                                    variant={summary.available >= 0 ? 'success' : 'danger'}
                                    size="sm"
                                />
                            </View>
                        )}
                    </GlassCard>
                </Animated.View>

                {/* ── Carrusel de Tarjetas ── */}
                <Animated.View entering={FadeInDown.duration(500).delay(200)}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: C.text.primary }]}>Tus Tarjetas</Text>
                        <Pressable onPress={() => router.push('/(tabs)/cards')}>
                            <Text style={[styles.sectionAction, { color: C.accent.primary }]}>Ver todas →</Text>
                        </Pressable>
                    </View>
                    {cards.length === 0 ? (
                        <GlassCard variant="default" padding="lg">
                            <Text style={[styles.emptyText, { color: C.text.tertiary }]}>
                                💳 Agrega tu primera tarjeta desde la pestaña "Tarjetas"
                            </Text>
                        </GlassCard>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.cardsCarousel}
                        >
                            {cards.map((card) => {
                                const status = getCardStatus(card);
                                return (
                                    <GlassCard
                                        key={card.id}
                                        pressable
                                        style={StyleSheet.flatten([
                                            styles.miniCard,
                                            { borderLeftColor: card.card_color ?? C.accent.primary, borderLeftWidth: 3 },
                                        ])}
                                        padding="lg"
                                    >
                                        <Text style={[styles.miniCardBank, { color: C.text.primary }]}>{card.bank_name}</Text>
                                        <Text style={[styles.miniCardNumber, { color: C.text.tertiary }]}>
                                            {formatCardNumber(card.last_four_digits)}
                                        </Text>
                                        <Text style={[styles.miniCardBalance, { color: C.text.primary }]}>
                                            {formatCurrency(card.current_balance, false)}
                                        </Text>
                                        <Badge
                                            text={status === 'safe' ? 'OK' : status === 'warning' ? 'Precaución' : 'Urgente'}
                                            variant={status === 'safe' ? 'success' : status}
                                            size="sm"
                                            icon={status === 'safe' ? '🟢' : status === 'warning' ? '🟡' : '🔴'}
                                            style={styles.miniCardBadge}
                                        />
                                    </GlassCard>
                                );
                            })}
                        </ScrollView>
                    )}
                </Animated.View>

                {/* ── Resumen del Mes ── */}
                <Animated.View entering={FadeInDown.duration(500).delay(300)}>
                    <Text style={[styles.sectionTitle, styles.sectionTitleFull, { color: C.text.primary }]}>
                        Resumen del Mes
                    </Text>
                    <GlassCard variant="default" padding="lg">
                        <SummaryRow
                            iconName="wallet-outline"
                            label="Ingresos"
                            amount={summary?.totalIncome ?? 0}
                            accentColor={C.accent.success}
                            labelColor={C.text.secondary}
                            borderColor={C.border.secondary}
                        />
                        <SummaryRow
                            iconName="trending-down-outline"
                            label="Gastos"
                            amount={summary?.totalExpenses ?? 0}
                            accentColor={C.accent.danger}
                            labelColor={C.text.secondary}
                            borderColor={C.border.secondary}
                        />
                        <SummaryRow
                            iconName="business-outline"
                            label="Ahorro"
                            amount={summary?.totalSavings ?? 0}
                            accentColor={C.accent.info}
                            labelColor={C.text.secondary}
                            borderColor={C.border.secondary}
                        />
                        <SummaryRow
                            iconName="card-outline"
                            label="Deuda tarjetas"
                            amount={summary?.totalCardPayments ?? 0}
                            accentColor={C.accent.warning}
                            labelColor={C.text.secondary}
                            borderColor={C.border.secondary}
                            isLast
                        />
                    </GlassCard>
                </Animated.View>

                {/* ── Próximos Pagos ── */}
                {upcomingPayments.length > 0 && (
                    <Animated.View entering={FadeInDown.duration(500).delay(400)}>
                        <Text style={[styles.sectionTitle, styles.sectionTitleFull, { color: C.text.primary }]}>
                            Próximos Pagos
                        </Text>
                        {upcomingPayments.map((payment) => (
                            <GlassCard
                                key={payment.id}
                                variant="default"
                                padding="lg"
                                style={styles.paymentCard}
                            >
                                <View style={styles.paymentRow}>
                                    <Badge
                                        text={payment.status === 'danger' ? '🔴' : '🟡'}
                                        variant={payment.status === 'safe' ? 'success' : payment.status}
                                        size="md"
                                    />
                                    <View style={styles.paymentInfo}>
                                        <Text style={[styles.paymentCardName, { color: C.text.primary }]}>
                                            {payment.bank_name} · Pago en {payment.daysToPayment} días
                                        </Text>
                                        <Text style={[styles.paymentMinimum, { color: C.text.tertiary }]}>
                                            Saldo: {formatCurrency(payment.current_balance, false)}
                                        </Text>
                                    </View>
                                </View>
                            </GlassCard>
                        ))}
                    </Animated.View>
                )}

                {/* Espaciado inferior para la tab bar */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* ── FAB: Nuevo Gasto (SmartWallet floating_button) ── */}
            <Pressable
                style={[
                    styles.fab,
                    {
                        backgroundColor: C.accent.primary,
                        borderColor: C.background.primary,
                    },
                ]}
                onPress={() => setExpenseModalVisible(true)}
            >
                <Ionicons name="add" size={28} color="#FFFFFF" />
            </Pressable>

            {/* ── Modal de gasto ── */}
            <AddExpenseModal
                visible={expenseModalVisible}
                onClose={() => setExpenseModalVisible(false)}
            />
        </View>
    );
}

// ── Componente auxiliar: fila de resumen ──

interface SummaryRowProps {
    iconName: keyof typeof Ionicons.glyphMap;
    label: string;
    amount: number;
    accentColor: string;
    labelColor: string;
    borderColor: string;
    isLast?: boolean;
}

/** Fila individual del resumen mensual */
function SummaryRow({ iconName, label, amount, accentColor, labelColor, borderColor, isLast = false }: SummaryRowProps) {
    return (
        <View style={[styles.summaryRow, !isLast && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
            <View style={styles.summaryLeft}>
                <Ionicons name={iconName} size={20} color={accentColor} />
                <Text style={[styles.summaryLabel, { color: labelColor }]}>{label}</Text>
            </View>
            <Text style={[styles.summaryAmount, { color: accentColor }]}>
                {formatCurrency(amount, false)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING['5xl'],
    },
    // ── Header ──
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING['2xl'],
    },
    greeting: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.xs,
        letterSpacing: TYPOGRAPHY.letterSpacing.widest,
        textTransform: 'uppercase',
    },
    userName: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size['2xl'],
        marginTop: 2,
    },
    notificationBadge: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    notifDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    // ── Balance ──
    balanceCard: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    balanceLabel: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.xs,
        letterSpacing: TYPOGRAPHY.letterSpacing.widest,
        textTransform: 'uppercase',
        marginBottom: SPACING.sm,
    },
    balanceChange: {
        marginTop: SPACING.md,
    },
    // ── Section headers ──
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.xl,
        letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    },
    sectionTitleFull: {
        marginBottom: SPACING.md,
        marginTop: SPACING.xl,
    },
    sectionAction: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.xs,
        letterSpacing: TYPOGRAPHY.letterSpacing.widest,
        textTransform: 'uppercase',
    },
    // ── Balance details ──
    balanceDetails: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: SPACING.lg,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    balanceDetailItem: {
        alignItems: 'center',
        flex: 1,
    },
    balanceDetailLabel: {
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.xs,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    balanceDetailValue: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.md,
    },
    balanceDetailDivider: {
        width: 1,
        height: 30,
        opacity: 0.3,
    },
    // ── Cards carousel ──
    cardsCarousel: {
        paddingRight: SPACING.xl,
        gap: SPACING.md,
    },
    miniCard: {
        width: 155,
    },
    miniCardBank: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.md,
    },
    miniCardNumber: {
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.xs,
        marginTop: 2,
    },
    miniCardBalance: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.xl,
        marginTop: SPACING.sm,
    },
    miniCardBadge: {
        marginTop: SPACING.sm,
    },
    // ── Summary ──
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    summaryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    summaryLabel: {
        fontFamily: TYPOGRAPHY.family.medium,
        fontSize: TYPOGRAPHY.size.md,
    },
    summaryAmount: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.lg,
    },
    // ── Payments ──
    paymentCard: {
        marginBottom: SPACING.sm,
    },
    paymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    paymentInfo: {
        flex: 1,
    },
    paymentCardName: {
        fontFamily: TYPOGRAPHY.family.semibold,
        fontSize: TYPOGRAPHY.size.md,
    },
    paymentMinimum: {
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.sm,
        marginTop: 2,
    },
    // ── Bottom spacer ──
    bottomSpacer: {
        height: 20,
    },
    emptyText: {
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.md,
        textAlign: 'center' as const,
    },
    // FAB — Floating Action Button
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: RADIUS['3xl'],
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        ...SHADOWS.floating,
    },
});
