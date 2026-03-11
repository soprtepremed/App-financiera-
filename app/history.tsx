/**
 * HistoryScreen — Historial de gastos mes a mes
 * Muestra los gastos agrupados por mes con gráfico de tendencia.
 */
import React, { useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../src/store/themeStore';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS } from '../src/constants/theme';
import { GlassCard } from '../src/components/ui';
import { useExpenses } from '../src/hooks/useExpenses';
import { formatCurrency } from '../src/utils/formatters';
import { safeGoBack } from '../src/utils/navigation';

export default function HistoryScreen() {
    const router = useRouter();
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);
    const { data: expenses = [] } = useExpenses();

    // Agrupar gastos por mes
    const monthlyData = useMemo(() => {
        const grouped: Record<string, { total: number; count: number }> = {};

        expenses.forEach((exp: any) => {
            const date = new Date(exp.expense_date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!grouped[key]) grouped[key] = { total: 0, count: 0 };
            grouped[key].total += exp.amount;
            grouped[key].count += 1;
        });

        // Ordenar de más reciente a más antiguo
        return Object.entries(grouped)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([key, data]) => {
                const [year, month] = key.split('-');
                const monthNames = [
                    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                ];
                return {
                    key,
                    label: `${monthNames[parseInt(month) - 1]} ${year}`,
                    ...data,
                };
            });
    }, [expenses]);

    // Encontrar el mes con más gasto para la barra proporcional
    const maxTotal = Math.max(...monthlyData.map(m => m.total), 1);

    return (
        <View style={[styles.screen, { backgroundColor: C.background.primary }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <View style={styles.header}>
                <Pressable onPress={() => safeGoBack(router)} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={C.text.primary} />
                </Pressable>
                <Text style={[styles.title, { color: C.text.primary }]}>📊 Historial Mensual</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {monthlyData.length === 0 ? (
                    <GlassCard variant="elevated" padding="xl">
                        <View style={styles.emptyState}>
                            <Ionicons name="calendar-outline" size={48} color={C.text.tertiary} />
                            <Text style={[styles.emptyTitle, { color: C.text.secondary }]}>
                                Sin historial
                            </Text>
                            <Text style={[styles.emptySub, { color: C.text.tertiary }]}>
                                Registra gastos para ver tu historial mensual aquí.
                            </Text>
                        </View>
                    </GlassCard>
                ) : (
                    <>
                        {/* Resumen total */}
                        <GlassCard variant="elevated" padding="lg" style={styles.summaryCard}>
                            <Text style={[styles.summaryLabel, { color: C.text.tertiary }]}>
                                TOTAL HISTÓRICO
                            </Text>
                            <Text style={[styles.summaryAmount, { color: C.text.primary }]}>
                                {formatCurrency(expenses.reduce((s: number, e: any) => s + e.amount, 0), false)}
                            </Text>
                            <Text style={[styles.summaryMeta, { color: C.text.tertiary }]}>
                                {expenses.length} gasto{expenses.length !== 1 ? 's' : ''} en {monthlyData.length} mes{monthlyData.length !== 1 ? 'es' : ''}
                            </Text>
                        </GlassCard>

                        {/* Meses */}
                        {monthlyData.map((month) => {
                            const barWidth = `${Math.max((month.total / maxTotal) * 100, 8)}%`;
                            return (
                                <GlassCard key={month.key} variant="default" padding="lg" style={styles.monthCard}>
                                    <View style={styles.monthHeader}>
                                        <Text style={[styles.monthLabel, { color: C.text.primary }]}>
                                            {month.label}
                                        </Text>
                                        <Text style={[styles.monthAmount, { color: C.accent.danger }]}>
                                            {formatCurrency(month.total, false)}
                                        </Text>
                                    </View>
                                    <View style={[styles.barBg, { backgroundColor: C.background.tertiary }]}>
                                        <View style={[
                                            styles.barFill,
                                            { width: barWidth as any, backgroundColor: C.accent.primary },
                                        ]} />
                                    </View>
                                    <Text style={[styles.monthCount, { color: C.text.tertiary }]}>
                                        {month.count} gasto{month.count !== 1 ? 's' : ''}
                                    </Text>
                                </GlassCard>
                            );
                        })}
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: SPACING['4xl'], paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg,
    },
    backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
    title: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xl },
    content: { paddingHorizontal: SPACING.xl },
    summaryCard: { marginBottom: SPACING.lg, alignItems: 'center' },
    summaryLabel: {
        fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xs,
        letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: SPACING.xs,
    },
    summaryAmount: {
        fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size['3xl'],
    },
    summaryMeta: {
        fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.sm, marginTop: SPACING.xs,
    },
    monthCard: { marginBottom: SPACING.sm },
    monthHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    monthLabel: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md },
    monthAmount: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md },
    barBg: {
        height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: SPACING.xs,
    },
    barFill: { height: '100%', borderRadius: 4 },
    monthCount: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs },
    emptyState: { alignItems: 'center', paddingVertical: SPACING.xl },
    emptyTitle: {
        fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.lg,
        marginTop: SPACING.md,
    },
    emptySub: {
        fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.sm,
        marginTop: SPACING.xs, textAlign: 'center',
    },
});
