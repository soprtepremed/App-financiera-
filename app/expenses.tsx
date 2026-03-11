/**
 * ExpensesScreen — Historial de gastos con resumen semanal y recurrentes
 * Permite registrar gastos, ver historial agrupado por día,
 * y analizar gastos recurrentes con proyección mensual.
 */
import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    RefreshControl, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../src/components/ui';
import { AddExpenseModal } from '../src/components/expenses/AddExpenseModal';
import {
    useAllMonthExpenses, useWeeklySummary,
    useRecurringAnalysis, useDeleteExpense,
} from '../src/hooks/useExpenses';
import { getCategoryIconName } from '../src/hooks/useCategories';
import { formatCurrency } from '../src/utils/formatters';
import { safeGoBack } from '../src/utils/navigation';
import { useThemeStore } from '../src/store/themeStore';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS } from '../src/constants/theme';

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function ExpensesScreen() {
    const router = useRouter();
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);
    const { data: expenses = [], isRefetching, refetch } = useAllMonthExpenses();
    const weekly = useWeeklySummary();
    const recurring = useRecurringAnalysis();
    const deleteExpense = useDeleteExpense();
    const [modalVisible, setModalVisible] = useState(false);

    const now = new Date();
    const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

    // Agrupar gastos por día
    const groupedByDay = useMemo(() => {
        const groups: Record<string, any[]> = {};
        for (const exp of expenses) {
            const dateKey = (exp as any).expense_date;
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(exp);
        }
        return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
    }, [expenses]);

    const formatDayLabel = (dateStr: string) => {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (dateStr === today) return 'Hoy';
        if (dateStr === yesterday) return 'Ayer';
        const d = new Date(dateStr + 'T12:00:00');
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return `${days[d.getDay()]} ${d.getDate()}`;
    };

    const handleDeleteExpense = (id: string, desc: string) => {
        Alert.alert('Eliminar gasto', `¿Eliminar "${desc || 'gasto'}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar', style: 'destructive',
                onPress: () => deleteExpense.mutate(id),
            },
        ]);
    };

    const totalMonth = expenses.reduce((s: number, e: any) => s + e.amount, 0);

    const trendIcon = weekly.trend === 'up' ? 'trending-up' : weekly.trend === 'down' ? 'trending-down' : 'remove';
    const trendColor = weekly.trend === 'up' ? C.accent.danger : weekly.trend === 'down' ? C.accent.success : C.text.tertiary;

    return (
        <View style={[styles.screen, { backgroundColor: C.background.primary }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => safeGoBack(router)} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={C.text.primary} />
                </Pressable>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: C.text.primary }]}>Mis Gastos</Text>
                    <Text style={[styles.subtitle, { color: C.text.tertiary }]}>{monthLabel}</Text>
                </View>
                <Pressable
                    onPress={() => setModalVisible(true)}
                    style={[styles.addBtn, { backgroundColor: C.accent.primary }]}
                >
                    <Ionicons name="add" size={20} color="#FFF" />
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch}
                        tintColor={C.accent.primary} colors={[C.accent.primary]} />
                }
            >
                {/* ── Total del mes ── */}
                <Animated.View entering={FadeInDown.duration(400)}>
                    <GlassCard variant="elevated" padding="lg" style={styles.totalCard}>
                        <Text style={[styles.totalLabel, { color: C.text.tertiary }]}>
                            TOTAL DEL MES
                        </Text>
                        <Text style={[styles.totalAmount, { color: C.accent.danger }]}>
                            {formatCurrency(totalMonth, false)}
                        </Text>
                        <Text style={[styles.totalMeta, { color: C.text.tertiary }]}>
                            {expenses.length} gasto{expenses.length !== 1 ? 's' : ''} registrado{expenses.length !== 1 ? 's' : ''}
                        </Text>
                    </GlassCard>
                </Animated.View>

                {/* ── Resumen Semanal ── */}
                <Animated.View entering={FadeInDown.duration(400).delay(80)}>
                    <GlassCard variant="default" padding="lg" style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="calendar-outline" size={18} color={C.accent.primary} />
                            <Text style={[styles.sectionTitle, { color: C.text.primary }]}>
                                Resumen Semanal
                            </Text>
                            <Ionicons name={trendIcon as any} size={18} color={trendColor} />
                        </View>

                        <View style={styles.weeklyGrid}>
                            <View style={styles.weeklyItem}>
                                <Text style={[styles.weeklyLabel, { color: C.text.tertiary }]}>
                                    Esta semana
                                </Text>
                                <Text style={[styles.weeklyValue, { color: C.text.primary }]}>
                                    {formatCurrency(weekly.thisWeek, false)}
                                </Text>
                            </View>
                            <View style={[styles.weeklyDivider, { backgroundColor: C.border.secondary }]} />
                            <View style={styles.weeklyItem}>
                                <Text style={[styles.weeklyLabel, { color: C.text.tertiary }]}>
                                    Semana pasada
                                </Text>
                                <Text style={[styles.weeklyValue, { color: C.text.secondary }]}>
                                    {formatCurrency(weekly.lastWeek, false)}
                                </Text>
                            </View>
                            <View style={[styles.weeklyDivider, { backgroundColor: C.border.secondary }]} />
                            <View style={styles.weeklyItem}>
                                <Text style={[styles.weeklyLabel, { color: C.text.tertiary }]}>
                                    Prom./día
                                </Text>
                                <Text style={[styles.weeklyValue, { color: C.accent.primary }]}>
                                    {formatCurrency(weekly.dailyAvg, false)}
                                </Text>
                            </View>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* ── Gastos Recurrentes ── */}
                {recurring.length > 0 && (
                    <Animated.View entering={FadeInDown.duration(400).delay(160)}>
                        <GlassCard variant="default" padding="lg" style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="repeat-outline" size={18} color={C.accent.warning} />
                                <Text style={[styles.sectionTitle, { color: C.text.primary }]}>
                                    Gastos Recurrentes
                                </Text>
                            </View>

                            {recurring.map((item, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.recurringRow,
                                        i > 0 && { borderTopWidth: 1, borderTopColor: C.border.secondary },
                                    ]}
                                >
                                    <View style={[styles.recurringIcon, { backgroundColor: `${item.categoryColor}20` }]}>
                                        <Ionicons
                                            name={getCategoryIconName(item.categoryIcon) as any}
                                            size={20}
                                            color={item.categoryColor}
                                        />
                                    </View>
                                    <View style={styles.recurringInfo}>
                                        <Text style={[styles.recurringName, { color: C.text.primary }]}>
                                            {item.categoryName}
                                        </Text>
                                        <Text style={[styles.recurringMeta, { color: C.text.tertiary }]}>
                                            {formatCurrency(item.avgPerOccurrence, false)}/vez × {item.occurrences} veces
                                        </Text>
                                    </View>
                                    <View style={styles.recurringRight}>
                                        <Text style={[styles.recurringTotal, { color: C.accent.danger }]}>
                                            {formatCurrency(item.totalAmount, false)}
                                        </Text>
                                        <Text style={[styles.recurringProjection, { color: C.text.tertiary }]}>
                                            ~{formatCurrency(item.monthlyProjection, false)}/mes
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </GlassCard>
                    </Animated.View>
                )}

                {/* ── Historial por día ── */}
                <Animated.View entering={FadeInDown.duration(400).delay(240)}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="time-outline" size={18} color={C.accent.info} />
                        <Text style={[styles.sectionTitle, { color: C.text.primary }]}>
                            Historial
                        </Text>
                    </View>

                    {groupedByDay.length === 0 ? (
                        <GlassCard variant="default" padding="xl">
                            <View style={styles.emptyState}>
                                <Ionicons name="receipt-outline" size={48} color={C.text.tertiary} />
                                <Text style={[styles.emptyTitle, { color: C.text.secondary }]}>
                                    Sin gastos este mes
                                </Text>
                                <Text style={[styles.emptySub, { color: C.text.tertiary }]}>
                                    Toca + para registrar tu primer gasto
                                </Text>
                            </View>
                        </GlassCard>
                    ) : (
                        groupedByDay.map(([dateKey, dayExpenses]) => {
                            const dayTotal = dayExpenses.reduce((s: number, e: any) => s + e.amount, 0);
                            return (
                                <View key={dateKey} style={styles.dayGroup}>
                                    <View style={styles.dayHeader}>
                                        <Text style={[styles.dayLabel, { color: C.text.primary }]}>
                                            {formatDayLabel(dateKey)}
                                        </Text>
                                        <Text style={[styles.dayTotal, { color: C.text.tertiary }]}>
                                            {formatCurrency(dayTotal, false)}
                                        </Text>
                                    </View>
                                    <GlassCard variant="default" padding="md">
                                        {dayExpenses.map((exp: any, i: number) => {
                                            const cat = exp.expense_categories;
                                            const card = exp.credit_cards;
                                            return (
                                                <Pressable
                                                    key={exp.id}
                                                    onLongPress={() => handleDeleteExpense(exp.id, exp.description)}
                                                    style={[
                                                        styles.expenseRow,
                                                        i > 0 && { borderTopWidth: 1, borderTopColor: C.border.secondary },
                                                    ]}
                                                >
                                                    <View style={[
                                                        styles.expenseIcon,
                                                        { backgroundColor: `${cat?.color ?? C.accent.primary}20` },
                                                    ]}>
                                                        <Ionicons
                                                            name={getCategoryIconName(cat?.icon ?? '📦') as any}
                                                            size={18}
                                                            color={cat?.color ?? C.accent.primary}
                                                        />
                                                    </View>
                                                    <View style={styles.expenseInfo}>
                                                        <Text style={[styles.expenseDesc, { color: C.text.primary }]}>
                                                            {exp.description || cat?.name || 'Gasto'}
                                                        </Text>
                                                        <Text style={[styles.expenseCard, { color: C.text.tertiary }]}>
                                                            {card
                                                                ? `${card.card_alias && card.bank_name === 'Otro' ? card.card_alias : card.bank_name} •••• ${card.last_four_digits}`
                                                                : 'Efectivo'}
                                                            {exp.is_recurring && ' · 🔄'}
                                                        </Text>
                                                    </View>
                                                    <Text style={[styles.expenseAmount, { color: C.accent.danger }]}>
                                                        -{formatCurrency(exp.amount, false)}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </GlassCard>
                                </View>
                            );
                        })
                    )}
                </Animated.View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* FAB */}
            <Pressable
                onPress={() => setModalVisible(true)}
                style={[styles.fab, { backgroundColor: C.accent.primary }]}
            >
                <Ionicons name="add" size={28} color="#FFF" />
            </Pressable>

            <AddExpenseModal
                visible={modalVisible}
                onClose={() => { setModalVisible(false); refetch(); }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: SPACING['4xl'], paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md,
    },
    backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
    title: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xl },
    subtitle: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.sm },
    addBtn: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
    },
    content: { paddingHorizontal: SPACING.xl },

    // Total
    totalCard: { marginBottom: SPACING.md, alignItems: 'center' },
    totalLabel: {
        fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xs,
        letterSpacing: 1.5, textTransform: 'uppercase',
    },
    totalAmount: { fontFamily: TYPOGRAPHY.family.bold, fontSize: 32, marginVertical: SPACING.xs },
    totalMeta: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.sm },

    // Section
    sectionCard: { marginBottom: SPACING.md },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    sectionTitle: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md, flex: 1 },

    // Weekly
    weeklyGrid: { flexDirection: 'row', alignItems: 'center' },
    weeklyItem: { flex: 1, alignItems: 'center' },
    weeklyDivider: { width: 1, height: 36 },
    weeklyLabel: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs, marginBottom: 2 },
    weeklyValue: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md },

    // Recurring
    recurringRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, gap: SPACING.sm,
    },
    recurringIcon: {
        width: 40, height: 40, borderRadius: RADIUS.lg,
        justifyContent: 'center', alignItems: 'center',
    },
    recurringInfo: { flex: 1 },
    recurringName: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.sm },
    recurringMeta: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs, marginTop: 1 },
    recurringRight: { alignItems: 'flex-end' },
    recurringTotal: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.sm },
    recurringProjection: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs, marginTop: 1 },

    // Day groups
    dayGroup: { marginBottom: SPACING.sm },
    dayHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: SPACING.xs,
        paddingHorizontal: SPACING.xs,
    },
    dayLabel: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.sm },
    dayTotal: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm },

    // Expense row
    expenseRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, gap: SPACING.sm,
    },
    expenseIcon: {
        width: 36, height: 36, borderRadius: RADIUS.md,
        justifyContent: 'center', alignItems: 'center',
    },
    expenseInfo: { flex: 1 },
    expenseDesc: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm },
    expenseCard: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs, marginTop: 1 },
    expenseAmount: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.sm },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: SPACING.xl },
    emptyTitle: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.lg, marginTop: SPACING.md },
    emptySub: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.sm, marginTop: SPACING.xs },

    // FAB
    fab: {
        position: 'absolute', bottom: SPACING.xl, right: SPACING.xl,
        width: 56, height: 56, borderRadius: 28,
        justifyContent: 'center', alignItems: 'center',
    },
});
