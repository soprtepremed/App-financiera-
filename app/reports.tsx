/**
 * Reports Screen — Reportes y análisis financiero
 * Visualización de gastos por categoría, tendencia mensual y resumen de deuda.
 * Ruta: app/reports.tsx (accesible desde Profile)
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, ProgressBar } from '../src/components/ui';
import { useExpenses, useMonthSummary } from '../src/hooks/useExpenses';
import { useCards } from '../src/hooks/useCards';
import { useBudgetSummary } from '../src/hooks/useBudget';
import { formatCurrency } from '../src/utils/formatters';
import { useThemeStore } from '../src/store/themeStore';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS } from '../src/constants/theme';
import { safeGoBack } from '../src/utils/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_MAX_W = SCREEN_WIDTH - SPACING.xl * 4 - 80;

// Últimos 6 meses
function getLast6Months() {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ month: d.getMonth(), year: d.getFullYear(), label: d.toLocaleDateString('es-MX', { month: 'short' }) });
    }
    return months;
}

// Hook simple para obtener total de gastos de un mes específico
function useMonthTotal(month: number, year: number) {
    const { data: expenses = [] } = useExpenses({ month, year });
    return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export default function ReportsScreen() {
    const router = useRouter();
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());

    const { data: expenses = [] } = useExpenses({ month: selectedMonth, year: selectedYear });
    const { data: summary } = useMonthSummary(selectedMonth, selectedYear);
    const { data: cards = [] } = useCards();
    const { data: budgetSummary } = useBudgetSummary();
    const months = getLast6Months();

    // Gastos agrupados por categoría
    const byCategory = expenses.reduce<Record<string, { name: string; color: string; total: number }>>((acc, e) => {
        const key = (e as any).category_id ?? 'sin-cat';
        const catName = (e as any).categories?.name ?? 'Sin categoría';
        const catColor = (e as any).categories?.color ?? C.text.tertiary;
        if (!acc[key]) acc[key] = { name: catName, color: catColor, total: 0 };
        acc[key].total += e.amount;
        return acc;
    }, {});

    const categoryList = Object.values(byCategory).sort((a, b) => b.total - a.total);
    const maxCategoryTotal = categoryList[0]?.total ?? 1;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Deuda total de tarjetas
    const totalDebt = cards.reduce((sum, c) => sum + (c.current_balance ?? 0), 0);
    const totalLimit = cards.reduce((sum, c) => sum + (c.credit_limit ?? 0), 0);
    const debtPct = totalLimit > 0 ? (totalDebt / totalLimit) * 100 : 0;

    return (
        <View style={[styles.screen, { backgroundColor: C.background.primary }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => safeGoBack(router)} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={C.text.primary} />
                </Pressable>
                <Text style={[styles.title, { color: C.text.primary }]}>📊 Reportes</Text>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* ── Selector de mes (últimos 6) ── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthBar}>
                    {months.map((m, i) => {
                        const isActive = m.month === selectedMonth && m.year === selectedYear;
                        return (
                            <Pressable
                                key={i}
                                onPress={() => { setSelectedMonth(m.month); setSelectedYear(m.year); }}
                                style={[
                                    styles.monthChip,
                                    { borderColor: C.border.secondary },
                                    isActive && { backgroundColor: C.accent.primary, borderColor: C.accent.primary },
                                ]}
                            >
                                <Text style={[
                                    styles.monthChipText,
                                    { color: isActive ? '#FFF' : C.text.secondary },
                                ]}>
                                    {m.label.toUpperCase()}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                {/* ── Resumen del mes ── */}
                <Animated.View entering={FadeInDown.duration(400)}>
                    <View style={styles.summaryRow}>
                        <GlassCard variant="elevated" padding="lg" style={styles.summaryCard}>
                            <Text style={[styles.summaryLabel, { color: C.text.tertiary }]}>GASTADO</Text>
                            <Text style={[styles.summaryValue, { color: C.accent.danger }]}>
                                {formatCurrency(totalExpenses)}
                            </Text>
                        </GlassCard>
                        <GlassCard variant="elevated" padding="lg" style={styles.summaryCard}>
                            <Text style={[styles.summaryLabel, { color: C.text.tertiary }]}>INGRESOS</Text>
                            <Text style={[styles.summaryValue, { color: C.accent.success }]}>
                                {formatCurrency(budgetSummary?.totalIncome ?? 0)}
                            </Text>
                        </GlassCard>
                    </View>

                    <View style={styles.summaryRow}>
                        <GlassCard variant="elevated" padding="lg" style={styles.summaryCard}>
                            <Text style={[styles.summaryLabel, { color: C.text.tertiary }]}>BALANCE</Text>
                            <Text style={[
                                styles.summaryValue,
                                {
                                    color: (budgetSummary?.totalIncome ?? 0) - totalExpenses >= 0
                                        ? C.accent.success : C.accent.danger,
                                },
                            ]}>
                                {formatCurrency((budgetSummary?.totalIncome ?? 0) - totalExpenses)}
                            </Text>
                        </GlassCard>
                        <GlassCard variant="elevated" padding="lg" style={styles.summaryCard}>
                            <Text style={[styles.summaryLabel, { color: C.text.tertiary }]}>MOVIMIENTOS</Text>
                            <Text style={[styles.summaryValue, { color: C.text.primary }]}>
                                {expenses.length}
                            </Text>
                        </GlassCard>
                    </View>
                </Animated.View>

                {/* ── Gastos por categoría ── */}
                <Animated.View entering={FadeInDown.duration(400).delay(80)}>
                    <GlassCard variant="default" padding="lg" style={styles.sectionCard}>
                        <Text style={[styles.sectionTitle, { color: C.text.primary }]}>
                            Gastos por categoría
                        </Text>
                        {categoryList.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="receipt-outline" size={36} color={C.text.tertiary} />
                                <Text style={[styles.emptyText, { color: C.text.tertiary }]}>
                                    Sin gastos este mes
                                </Text>
                            </View>
                        ) : (
                            categoryList.map((cat, i) => {
                                const barWidth = maxCategoryTotal > 0
                                    ? (cat.total / maxCategoryTotal) * BAR_MAX_W
                                    : 0;
                                const pct = totalExpenses > 0
                                    ? Math.round((cat.total / totalExpenses) * 100)
                                    : 0;
                                return (
                                    <Animated.View
                                        key={cat.name}
                                        entering={FadeInDown.duration(300).delay(i * 50)}
                                        style={styles.catRow}
                                    >
                                        <View style={styles.catLeft}>
                                            <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                                            <Text style={[styles.catName, { color: C.text.primary }]}>
                                                {cat.name}
                                            </Text>
                                        </View>
                                        <View style={styles.catRight}>
                                            <View style={[styles.catBarBg, { backgroundColor: C.background.tertiary }]}>
                                                <View style={[
                                                    styles.catBarFill,
                                                    { width: barWidth, backgroundColor: cat.color },
                                                ]} />
                                            </View>
                                            <Text style={[styles.catAmount, { color: C.text.primary }]}>
                                                {formatCurrency(cat.total)}
                                            </Text>
                                            <Text style={[styles.catPct, { color: C.text.tertiary }]}>
                                                {pct}%
                                            </Text>
                                        </View>
                                    </Animated.View>
                                );
                            })
                        )}
                    </GlassCard>
                </Animated.View>

                {/* ── Estado de deuda en tarjetas ── */}
                <Animated.View entering={FadeInDown.duration(400).delay(140)}>
                    <GlassCard variant="default" padding="lg" style={styles.sectionCard}>
                        <Text style={[styles.sectionTitle, { color: C.text.primary }]}>Deuda total tarjetas</Text>
                        <Text style={[styles.debtValue, { color: debtPct > 70 ? C.accent.danger : C.text.primary }]}>
                            {formatCurrency(totalDebt)}
                        </Text>
                        <ProgressBar
                            progress={debtPct}
                            label={`${Math.round(debtPct)}% del límite total (${formatCurrency(totalLimit)})`}
                            showPercentage={false}
                            height={10}
                        />
                        {/* Por tarjeta */}
                        {cards.map((card) => {
                            const cardPct = card.credit_limit > 0
                                ? (card.current_balance / card.credit_limit) * 100
                                : 0;
                            return (
                                <View key={card.id} style={[styles.cardRow, { borderTopColor: C.border.secondary }]}>
                                    <View style={styles.cardLeft}>
                                        <View style={[styles.cardDot, { backgroundColor: card.card_color ?? C.accent.primary }]} />
                                        <View>
                                            <Text style={[styles.cardName, { color: C.text.primary }]}>
                                                {card.card_alias ?? card.bank_name}
                                            </Text>
                                            <Text style={[styles.cardSub, { color: C.text.tertiary }]}>
                                                •••• {card.last_four_digits}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.cardRight}>
                                        <Text style={[styles.cardBalance, { color: C.text.primary }]}>
                                            {formatCurrency(card.current_balance)}
                                        </Text>
                                        <Text style={[
                                            styles.cardPct,
                                            { color: cardPct > 80 ? C.accent.danger : C.accent.success },
                                        ]}>
                                            {Math.round(cardPct)}%
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </GlassCard>
                </Animated.View>

                {/* ── Top 5 gastos del mes ── */}
                <Animated.View entering={FadeInDown.duration(400).delay(200)}>
                    <GlassCard variant="default" padding="lg" style={styles.sectionCard}>
                        <Text style={[styles.sectionTitle, { color: C.text.primary }]}>Top 5 gastos</Text>
                        {expenses.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={[styles.emptyText, { color: C.text.tertiary }]}>
                                    Sin gastos este mes
                                </Text>
                            </View>
                        ) : (
                            [...expenses]
                                .sort((a, b) => b.amount - a.amount)
                                .slice(0, 5)
                                .map((e, i) => (
                                    <View key={e.id} style={[styles.topRow, { borderBottomColor: C.border.secondary }]}>
                                        <View style={[styles.topRank, { backgroundColor: C.background.elevated }]}>
                                            <Text style={[styles.topRankText, { color: C.text.tertiary }]}>
                                                #{i + 1}
                                            </Text>
                                        </View>
                                        <View style={styles.topInfo}>
                                            <Text style={[styles.topDesc, { color: C.text.primary }]}>
                                                {e.description ?? 'Sin descripción'}
                                            </Text>
                                            <Text style={[styles.topDate, { color: C.text.tertiary }]}>
                                                {new Date(e.expense_date).toLocaleDateString('es-MX', {
                                                    day: 'numeric', month: 'short',
                                                })}
                                            </Text>
                                        </View>
                                        <Text style={[styles.topAmount, { color: C.accent.danger }]}>
                                            -{formatCurrency(e.amount)}
                                        </Text>
                                    </View>
                                ))
                        )}
                    </GlassCard>
                </Animated.View>

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
    // Mes
    monthBar: { marginBottom: SPACING.lg, flexGrow: 0 },
    monthChip: {
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full, borderWidth: 1, marginRight: SPACING.sm,
    },
    monthChipText: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xs, letterSpacing: 1 },
    // Resumen
    summaryRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
    summaryCard: { flex: 1 },
    summaryLabel: {
        fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xs,
        letterSpacing: 1, textTransform: 'uppercase', marginBottom: SPACING.xs,
    },
    summaryValue: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xl },
    // Sections
    sectionCard: { marginBottom: SPACING.md },
    sectionTitle: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.lg, marginBottom: SPACING.md },
    // Category bars
    catRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
    catLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, width: 100 },
    catDot: { width: 10, height: 10, borderRadius: 5 },
    catName: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.xs, flex: 1 },
    catRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, justifyContent: 'flex-end' },
    catBarBg: { height: 6, borderRadius: 3, flex: 1 },
    catBarFill: { height: 6, borderRadius: 3 },
    catAmount: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xs, minWidth: 64, textAlign: 'right' },
    catPct: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs, minWidth: 30, textAlign: 'right' },
    // Debt
    debtValue: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size['2xl'], marginBottom: SPACING.md },
    cardRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: SPACING.sm, marginTop: SPACING.sm, borderTopWidth: 1,
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    cardDot: { width: 10, height: 10, borderRadius: 5 },
    cardName: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm },
    cardSub: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs },
    cardRight: { alignItems: 'flex-end' },
    cardBalance: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.sm },
    cardPct: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xs },
    // Top 5
    topRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm,
        gap: SPACING.md, borderBottomWidth: 1,
    },
    topRank: {
        width: 28, height: 28, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center',
    },
    topRankText: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xs },
    topInfo: { flex: 1 },
    topDesc: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm },
    topDate: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs },
    topAmount: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.sm },
    // Empty
    emptyState: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
    emptyText: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.md },
    bottomSpacer: { height: 20 },
});
