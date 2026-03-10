/**
 * Budget Screen - Presupuesto e ingresos
 * Resumen financiero mensual con ingresos, gastos y distribución
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
    RefreshControl,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, ProgressBar, ProgressRing, Button, Input } from '../../src/components/ui';
import {
    useIncomeSources,
    useBudgetSummary,
    useCreateIncome,
    useDeleteIncome,
    type IncomeFormData,
} from '../../src/hooks/useBudget';
import { formatCurrency, parseAmount } from '../../src/utils/formatters';
import { useThemeStore } from '../../src/store/themeStore';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS } from '../../src/constants/theme';

export default function BudgetScreen() {
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);
    const { data: incomes = [], refetch, isRefetching } = useIncomeSources();
    const { data: summary } = useBudgetSummary();
    const [showIncomeModal, setShowIncomeModal] = useState(false);

    const totalIncome = summary?.totalIncome ?? 0;
    const totalExpenses = summary?.totalExpenses ?? 0;
    const available = summary?.available ?? 0;
    const savingsPercent = totalIncome > 0
        ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
        : 0;

    return (
        <View style={[styles.screen, { backgroundColor: C.background.primary }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: C.text.primary }]}>Presupuesto</Text>
                <Text style={[styles.month, { color: C.text.tertiary }]}>
                    {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                </Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch}
                        tintColor={C.accent.primary} />
                }
            >
                {/* Anillo de resumen */}
                <Animated.View entering={FadeInDown.duration(500)}>
                    <GlassCard variant="elevated" padding="xl" style={styles.summaryCard}>
                        <View style={styles.ringRow}>
                            <ProgressRing
                                progress={Math.min(savingsPercent, 100)}
                                size={120}
                                strokeWidth={10}
                                subText="Ahorro"
                            />
                            <View style={styles.summaryCol}>
                                <SummaryRow label="Ingresos" amount={totalIncome} color={C.accent.success} textColor={C.text.secondary} />
                                <SummaryRow label="Gastos" amount={totalExpenses} color={C.accent.danger} textColor={C.text.secondary} />
                                <SummaryRow label="Ahorro" amount={summary?.totalSavings ?? 0} color={C.accent.info} textColor={C.text.secondary} />
                                <View style={[styles.divider, { backgroundColor: C.border.secondary }]} />
                                <SummaryRow
                                    label="Disponible"
                                    amount={available}
                                    color={available >= 0 ? C.accent.success : C.accent.danger}
                                    textColor={C.text.secondary}
                                    bold
                                />
                            </View>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* Distribución */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)}>
                    <GlassCard variant="default" padding="lg" style={styles.sectionCard}>
                        <Text style={[styles.sectionTitle, { color: C.text.primary }]}>Distribución</Text>
                        {totalIncome > 0 ? (
                            <>
                                <ProgressBar
                                    progress={totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0}
                                    label="Gastos vs Ingresos"
                                    showPercentage
                                    height={8}
                                />
                                <View style={styles.spacerSm} />
                                <ProgressBar
                                    progress={totalIncome > 0 ? ((summary?.totalSavings ?? 0) / totalIncome) * 100 : 0}
                                    label="Ahorro vs Ingresos"
                                    showPercentage
                                    height={8}
                                />
                                <View style={styles.spacerSm} />
                                <ProgressBar
                                    progress={totalIncome > 0 ? ((summary?.totalCardPayments ?? 0) / totalIncome) * 100 : 0}
                                    label="Deuda tarjetas vs Ingresos"
                                    showPercentage
                                    height={8}
                                />
                            </>
                        ) : (
                            <Text style={[styles.emptyText, { color: C.text.tertiary }]}>
                                Agrega tus ingresos para ver la distribución.
                            </Text>
                        )}
                    </GlassCard>
                </Animated.View>

                {/* Fuentes de ingreso */}
                <Animated.View entering={FadeInDown.duration(500).delay(200)}>
                    <GlassCard variant="default" padding="lg" style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: C.text.primary }]}>Mis Ingresos</Text>
                            <Pressable
                                onPress={() => setShowIncomeModal(true)}
                                style={[styles.addIncomeBtn, { backgroundColor: 'rgba(108, 99, 255, 0.12)' }]}
                            >
                                <Text style={[styles.addIncomeBtnText, { color: C.accent.primary }]}>+ Agregar</Text>
                            </Pressable>
                        </View>

                        {incomes.length === 0 ? (
                            <View style={styles.emptyIncome}>
                                <Ionicons name="cash-outline" size={40} color={C.text.tertiary} />
                                <Text style={[styles.emptyText, { color: C.text.tertiary }]}>
                                    Registra tus fuentes de ingreso para llevar un mejor control.
                                </Text>
                            </View>
                        ) : (
                            incomes.map(income => (
                                <IncomeRow key={income.id} income={income} isDark={isDark} />
                            ))
                        )}
                    </GlassCard>
                </Animated.View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Modal de nuevo ingreso */}
            <AddIncomeModal
                visible={showIncomeModal}
                onClose={() => setShowIncomeModal(false)}
                isDark={isDark}
            />
        </View>
    );
}

// ── Componentes internos ──

function SummaryRow({ label, amount, color, textColor, bold = false }: {
    label: string; amount: number; color: string; textColor: string; bold?: boolean;
}) {
    return (
        <View style={styles.summaryRow}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={[styles.summaryLabel, { color: textColor }]}>{label}</Text>
            <Text style={[styles.summaryAmount, bold && styles.summaryAmountBold, { color }]}>
                {formatCurrency(amount)}
            </Text>
        </View>
    );
}

function IncomeRow({ income, isDark }: { income: any; isDark: boolean }) {
    const C = getThemeColors(isDark);
    const deleteIncome = useDeleteIncome();
    const freqLabels: Record<string, string> = {
        weekly: 'Semanal',
        biweekly: 'Quincenal',
        monthly: 'Mensual',
    };

    return (
        <View style={[styles.incomeRow, { borderBottomColor: C.border.secondary }]}>
            <View>
                <Text style={[styles.incomeName, { color: C.text.primary }]}>{income.name}</Text>
                <Text style={[styles.incomeFreq, { color: C.text.tertiary }]}>
                    {freqLabels[income.frequency] ?? income.frequency}
                </Text>
            </View>
            <View style={styles.incomeRight}>
                <Text style={[styles.incomeAmount, { color: C.accent.success }]}>
                    {formatCurrency(income.amount)}
                </Text>
                <Pressable onPress={() => deleteIncome.mutate(income.id)}>
                    <Text style={[styles.deleteBtn, { color: C.text.tertiary }]}>✕</Text>
                </Pressable>
            </View>
        </View>
    );
}

function AddIncomeModal({ visible, onClose, isDark }: {
    visible: boolean; onClose: () => void; isDark: boolean;
}) {
    const C = getThemeColors(isDark);
    const createIncome = useCreateIncome();
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');

    const handleSave = async () => {
        if (!name.trim() || !amount || parseAmount(amount) <= 0) return;

        try {
            await createIncome.mutateAsync({
                name: name.trim(),      // columna 'name' en la tabla income_sources
                amount: parseAmount(amount),
                frequency,
            });
            setName('');
            setAmount('');
            setFrequency('monthly');
            onClose();
        } catch (err: any) {
            const msg = err?.message ?? 'No se pudo guardar el ingreso';
            Alert.alert('Error al guardar', msg);
        }
    };

    const frequencies: { key: 'weekly' | 'biweekly' | 'monthly'; label: string }[] = [
        { key: 'weekly', label: 'Semanal' },
        { key: 'biweekly', label: 'Quincenal' },
        { key: 'monthly', label: 'Mensual' },
    ];

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={[styles.modalContainer, { backgroundColor: C.background.secondary }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: C.text.primary }]}>Nuevo Ingreso</Text>
                            <Pressable onPress={onClose}>
                                <Text style={[styles.closeBtn, { color: C.text.tertiary }]}>✕</Text>
                            </Pressable>
                        </View>

                        <Input
                            label="Nombre"
                            placeholder="Ej: Salario, Freelance..."
                            value={name}
                            onChangeText={setName}
                        />
                        <Input
                            label="Monto"
                            placeholder="15000"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                            leftIcon={<Text style={[styles.dollarIcon, { color: C.text.secondary }]}>$</Text>}
                        />

                        <Text style={[styles.freqLabel, { color: C.text.secondary }]}>Frecuencia</Text>
                        <View style={styles.freqRow}>
                            {frequencies.map(f => (
                                <Pressable
                                    key={f.key}
                                    style={[
                                        styles.freqChip,
                                        { borderColor: C.border.primary },
                                        frequency === f.key && { backgroundColor: C.accent.primary, borderColor: C.accent.primary },
                                    ]}
                                    onPress={() => setFrequency(f.key)}
                                >
                                    <Text style={[
                                        styles.freqText,
                                        { color: C.text.secondary },
                                        frequency === f.key && { color: '#FFFFFF', fontFamily: TYPOGRAPHY.family.bold },
                                    ]}>
                                        {f.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        <Button
                            title="Agregar"
                            onPress={handleSave}
                            loading={createIncome.isPending}
                            fullWidth
                            size="lg"
                            style={styles.saveBtn}
                        />
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl },
    header: {
        paddingTop: SPACING['5xl'],
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.lg,
    },
    title: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size['2xl'],
    },
    month: {
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.md,
        textTransform: 'capitalize',
        marginTop: 2,
    },
    // Summary ring
    summaryCard: { marginBottom: SPACING.lg },
    ringRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xl },
    summaryCol: { flex: 1 },
    summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: SPACING.sm },
    summaryLabel: {
        flex: 1,
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.sm,
    },
    summaryAmount: {
        fontFamily: TYPOGRAPHY.family.semibold,
        fontSize: TYPOGRAPHY.size.sm,
    },
    summaryAmountBold: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md },
    divider: {
        height: 1,
        marginVertical: SPACING.sm,
    },
    // Sections
    sectionCard: { marginBottom: SPACING.lg },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.lg,
    },
    spacerSm: { height: SPACING.md },
    addIncomeBtn: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.full,
    },
    addIncomeBtnText: {
        fontFamily: TYPOGRAPHY.family.semibold,
        fontSize: TYPOGRAPHY.size.sm,
    },
    // Empty
    emptyIncome: { alignItems: 'center', paddingVertical: SPACING.xl },
    emptyText: {
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.md,
        textAlign: 'center',
    },
    // Income row
    incomeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
    },
    incomeName: {
        fontFamily: TYPOGRAPHY.family.semibold,
        fontSize: TYPOGRAPHY.size.md,
    },
    incomeFreq: {
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.xs,
        marginTop: 2,
    },
    incomeRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    incomeAmount: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.md,
    },
    deleteBtn: { fontSize: 16, padding: SPACING.xs },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    keyboardView: { flex: 1, justifyContent: 'flex-end' },
    modalContainer: {
        borderTopLeftRadius: RADIUS['2xl'],
        borderTopRightRadius: RADIUS['2xl'],
        padding: SPACING.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    modalTitle: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.xl,
    },
    closeBtn: { fontSize: 22, padding: SPACING.sm },
    dollarIcon: {
        fontFamily: TYPOGRAPHY.family.semibold,
        fontSize: 16,
    },
    freqLabel: {
        fontFamily: TYPOGRAPHY.family.medium,
        fontSize: TYPOGRAPHY.size.sm,
        marginBottom: SPACING.sm,
    },
    freqRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
    freqChip: {
        flex: 1,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full,
        borderWidth: 1.5,
        alignItems: 'center',
    },
    freqText: {
        fontFamily: TYPOGRAPHY.family.medium,
        fontSize: TYPOGRAPHY.size.sm,
    },
    saveBtn: { marginBottom: SPACING['2xl'] },
    bottomSpacer: { height: 20 },
});
