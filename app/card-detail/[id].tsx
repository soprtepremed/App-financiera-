/**
 * Card Detail Screen — Detalle de tarjeta de crédito
 * Muestra información completa, gastos recientes y pagos del mes.
 * Ruta: app/card-detail/[id].tsx
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    RefreshControl,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useCard, useDeleteCard, getDaysUntil, getCardStatus } from '../../src/hooks/useCards';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useCardPayments } from '../../src/hooks/useCardPayments';
import { PayCardModal } from '../../src/components/cards/PayCardModal';
import { AddExpenseModal } from '../../src/components/expenses/AddExpenseModal';
import { GlassCard, ProgressBar, Badge } from '../../src/components/ui';
import { formatCurrency } from '../../src/utils/formatters';
import { useThemeStore } from '../../src/store/themeStore';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function CardDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);

    const { data: card, isLoading, refetch, isRefetching } = useCard(id ?? '');
    const { data: expenses = [], refetch: refetchExp } = useExpenses({ cardId: id });
    const { data: payments = [] } = useCardPayments(id ?? '');
    const deleteCard = useDeleteCard();

    const [showPayModal, setShowPayModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);

    const handleDelete = () => {
        Alert.alert(
            'Eliminar Tarjeta',
            `¿Eliminar ${card?.bank_name} •••• ${card?.last_four_digits}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteCard.mutateAsync(id ?? '');
                        router.back();
                    },
                },
            ]
        );
    };

    if (isLoading || !card) {
        return (
            <View style={[styles.screen, { backgroundColor: C.background.primary, justifyContent: 'center', alignItems: 'center' }]}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <Text style={[styles.emptyText, { color: C.text.tertiary }]}>Cargando...</Text>
            </View>
        );
    }

    const utilisationPct = card.credit_limit > 0
        ? (card.current_balance / card.credit_limit) * 100
        : 0;
    const daysToPayment = getDaysUntil(card.payment_due_day);
    const daysToCutoff = getDaysUntil(card.cut_off_day);
    const status = getCardStatus(card);

    const statusColors: Record<string, string> = {
        safe: C.accent.success,
        warning: C.accent.warning,
        danger: C.accent.danger,
    };

    return (
        <View style={[styles.screen, { backgroundColor: C.background.primary }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* ── Header ── */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={C.text.primary} />
                </Pressable>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: C.text.primary }]}>
                        {card.card_alias ?? card.bank_name}
                    </Text>
                    <Text style={[styles.headerSub, { color: C.text.tertiary }]}>
                        •••• {card.last_four_digits}
                    </Text>
                </View>
                <Pressable onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={20} color={C.accent.danger} />
                </Pressable>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => { refetch(); refetchExp(); }}
                        tintColor={C.accent.primary}
                    />
                }
            >
                {/* ── Resumen principal ── */}
                <Animated.View entering={FadeInDown.duration(400)}>
                    <View style={[styles.cardHero, { backgroundColor: card.card_color ?? C.accent.primary }]}>
                        <View style={styles.heroTop}>
                            <Text style={styles.heroBank}>{card.bank_name}</Text>
                            <Badge
                                text={status === 'safe' ? 'Al día' : status === 'warning' ? 'Atención' : 'Urgente'}
                                variant={status === 'safe' ? 'success' : status === 'warning' ? 'warning' : 'danger'}
                                size="sm"
                            />
                        </View>
                        <Text style={styles.heroBalance}>{formatCurrency(card.current_balance)}</Text>
                        <Text style={styles.heroLimit}>de {formatCurrency(card.credit_limit)} límite</Text>
                        <View style={[styles.heroBar, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                            <View style={[
                                styles.heroBarFill,
                                {
                                    width: `${Math.min(utilisationPct, 100)}%` as any,
                                    backgroundColor: utilisationPct > 80 ? '#FF6B6B' : '#FFFFFF',
                                }
                            ]} />
                        </View>
                        <Text style={styles.heroUtil}>{Math.round(utilisationPct)}% utilizado</Text>
                    </View>
                </Animated.View>

                {/* ── Fechas clave ── */}
                <Animated.View entering={FadeInDown.duration(400).delay(80)}>
                    <GlassCard variant="elevated" padding="lg" style={styles.sectionCard}>
                        <View style={styles.datesRow}>
                            <View style={styles.dateItem}>
                                <Ionicons name="cut-outline" size={20} color={C.accent.warning} />
                                <Text style={[styles.dateNumber, { color: C.text.primary }]}>
                                    {daysToCutoff}d
                                </Text>
                                <Text style={[styles.dateLabel, { color: C.text.tertiary }]}>
                                    para corte
                                </Text>
                                <Text style={[styles.dateSub, { color: C.text.tertiary }]}>
                                    día {card.cut_off_day}
                                </Text>
                            </View>
                            <View style={[styles.dateDivider, { backgroundColor: C.border.secondary }]} />
                            <View style={styles.dateItem}>
                                <Ionicons name="calendar-outline" size={20} color={C.accent.info} />
                                <Text style={[styles.dateNumber, { color: daysToPayment <= 3 ? C.accent.danger : C.text.primary }]}>
                                    {daysToPayment}d
                                </Text>
                                <Text style={[styles.dateLabel, { color: C.text.tertiary }]}>
                                    para pago
                                </Text>
                                <Text style={[styles.dateSub, { color: C.text.tertiary }]}>
                                    día {card.payment_due_day}
                                </Text>
                            </View>
                            <View style={[styles.dateDivider, { backgroundColor: C.border.secondary }]} />
                            <View style={styles.dateItem}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={C.accent.success} />
                                <Text style={[styles.dateNumber, { color: C.text.primary }]}>
                                    {formatCurrency(card.minimum_payment)}
                                </Text>
                                <Text style={[styles.dateLabel, { color: C.text.tertiary }]}>
                                    pago mínimo
                                </Text>
                            </View>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* ── Acciones rápidas ── */}
                <Animated.View entering={FadeInDown.duration(400).delay(120)}>
                    <View style={styles.actionsRow}>
                        <Pressable
                            style={[styles.actionBtn, { backgroundColor: C.accent.primary }]}
                            onPress={() => setShowPayModal(true)}
                        >
                            <Ionicons name="card-outline" size={20} color="#FFF" />
                            <Text style={styles.actionBtnText}>Pagar</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.actionBtn, { backgroundColor: C.background.elevated }]}
                            onPress={() => setShowExpenseModal(true)}
                        >
                            <Ionicons name="add-circle-outline" size={20} color={C.accent.primary} />
                            <Text style={[styles.actionBtnText, { color: C.accent.primary }]}>Agregar gasto</Text>
                        </Pressable>
                    </View>
                </Animated.View>

                {/* ── Utilización ── */}
                <Animated.View entering={FadeInDown.duration(400).delay(160)}>
                    <GlassCard variant="default" padding="lg" style={styles.sectionCard}>
                        <Text style={[styles.sectionTitle, { color: C.text.primary }]}>Utilización</Text>
                        <ProgressBar
                            progress={utilisationPct}
                            label={`${formatCurrency(card.current_balance)} de ${formatCurrency(card.credit_limit)}`}
                            showPercentage
                            height={10}
                        />
                    </GlassCard>
                </Animated.View>

                {/* ── Pagos recientes ── */}
                {payments.length > 0 && (
                    <Animated.View entering={FadeInDown.duration(400).delay(200)}>
                        <GlassCard variant="default" padding="lg" style={styles.sectionCard}>
                            <Text style={[styles.sectionTitle, { color: C.text.primary }]}>Pagos recientes</Text>
                            {payments.slice(0, 5).map((p) => (
                                <View key={p.id} style={[styles.listRow, { borderBottomColor: C.border.secondary }]}>
                                    <View style={styles.listLeft}>
                                        <View style={[styles.listIcon, { backgroundColor: `${C.accent.success}20` }]}>
                                            <Ionicons name="checkmark" size={14} color={C.accent.success} />
                                        </View>
                                        <View>
                                            <Text style={[styles.listTitle, { color: C.text.primary }]}>
                                                {p.payment_type === 'minimum' ? 'Pago mínimo'
                                                    : p.payment_type === 'no_interest' ? 'Sin intereses'
                                                        : p.payment_type === 'full' ? 'Pago total'
                                                            : 'Personalizado'}
                                            </Text>
                                            <Text style={[styles.listSub, { color: C.text.tertiary }]}>
                                                {new Date(p.payment_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.listAmount, { color: C.accent.success }]}>
                                        {formatCurrency(p.amount_paid)}
                                    </Text>
                                </View>
                            ))}
                        </GlassCard>
                    </Animated.View>
                )}

                {/* ── Gastos del mes ── */}
                <Animated.View entering={FadeInDown.duration(400).delay(240)}>
                    <GlassCard variant="default" padding="lg" style={styles.sectionCard}>
                        <Text style={[styles.sectionTitle, { color: C.text.primary }]}>Gastos este mes</Text>
                        {expenses.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="receipt-outline" size={36} color={C.text.tertiary} />
                                <Text style={[styles.emptyText, { color: C.text.tertiary }]}>
                                    Sin gastos registrados
                                </Text>
                            </View>
                        ) : (
                            expenses.slice(0, 10).map((e) => (
                                <View key={e.id} style={[styles.listRow, { borderBottomColor: C.border.secondary }]}>
                                    <View style={styles.listLeft}>
                                        <View style={[styles.listIcon, { backgroundColor: C.background.elevated }]}>
                                            <Ionicons name="receipt-outline" size={14} color={C.text.secondary} />
                                        </View>
                                        <View>
                                            <Text style={[styles.listTitle, { color: C.text.primary }]}>
                                                {e.description ?? 'Sin descripción'}
                                            </Text>
                                            <Text style={[styles.listSub, { color: C.text.tertiary }]}>
                                                {new Date(e.expense_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.listAmount, { color: C.accent.danger }]}>
                                        -{formatCurrency(e.amount)}
                                    </Text>
                                </View>
                            ))
                        )}
                    </GlassCard>
                </Animated.View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Modales */}
            {showPayModal && (
                <PayCardModal
                    visible={showPayModal}
                    onClose={() => setShowPayModal(false)}
                    card={card}
                />
            )}
            <AddExpenseModal
                visible={showExpenseModal}
                onClose={() => setShowExpenseModal(false)}
                preselectedCardId={id}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: SPACING['4xl'],
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.lg,
    },
    backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
    headerCenter: { flex: 1 },
    headerTitle: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xl },
    headerSub: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.sm },
    // Hero card
    cardHero: {
        borderRadius: RADIUS['3xl'],
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        ...SHADOWS.floating,
    },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    heroBank: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md, color: 'rgba(255,255,255,0.8)' },
    heroBalance: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size['3xl'], color: '#FFF' },
    heroLimit: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.sm, color: 'rgba(255,255,255,0.7)', marginBottom: SPACING.md },
    heroBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: SPACING.xs },
    heroBarFill: { height: '100%', borderRadius: 3 },
    heroUtil: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.xs, color: 'rgba(255,255,255,0.7)' },
    // Dates
    sectionCard: { marginBottom: SPACING.md },
    datesRow: { flexDirection: 'row', alignItems: 'stretch' },
    dateItem: { flex: 1, alignItems: 'center', gap: 4 },
    dateDivider: { width: 1, marginVertical: SPACING.xs },
    dateNumber: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xl },
    dateLabel: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.xs, textAlign: 'center' },
    dateSub: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs },
    // Actions
    actionsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.xl,
    },
    actionBtnText: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.sm, color: '#FFF' },
    // Section title
    sectionTitle: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.lg, marginBottom: SPACING.md },
    // List rows
    listRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: SPACING.sm, borderBottomWidth: 1,
    },
    listLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
    listIcon: { width: 32, height: 32, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
    listTitle: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm },
    listSub: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs },
    listAmount: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.sm },
    // Empty
    emptyState: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
    emptyText: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.md, textAlign: 'center' },
    bottomSpacer: { height: 20 },
});
