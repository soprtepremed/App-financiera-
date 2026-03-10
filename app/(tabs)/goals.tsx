/**
 * Goals Screen - Metas de ahorro
 * Lista de metas con progreso visual, crear y contribuir
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
    Modal,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GlassCard, ProgressRing, ProgressBar, Button, Input } from '../../src/components/ui';
import { supabase } from '../../src/services/supabase';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { formatCurrency, parseAmount } from '../../src/utils/formatters';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS } from '../../src/constants/theme';

// ── Hooks locales ──

function useGoals() {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['goals'],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('savings_goals')
                .select('*')
                .eq('user_id', user.id)
                // CORRECTO: savings_goals usa 'status', NO 'is_active'
                .in('status', ['active', 'paused'])
                .order('priority', { ascending: true });
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user,
    });
}

function useCreateGoal() {
    const qc = useQueryClient();
    const { user } = useAuthStore();
    return useMutation({
        mutationFn: async (data: {
            /** Columna 'name' en la tabla savings_goals */
            name: string;
            target_amount: number;
            target_date: string;
            icon?: string;
            description?: string;
        }) => {
            if (!user) throw new Error('No autenticado');
            const { error } = await supabase
                .from('savings_goals')
                .insert({
                    user_id: user.id,
                    current_amount: 0,
                    status: 'active',
                    priority: 1,
                    ...data,
                });
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
    });
}

function useContribute() {
    const qc = useQueryClient();
    const { user } = useAuthStore();
    return useMutation({
        mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
            if (!user) throw new Error('No autenticado');
            const { data: goal } = await supabase.from('savings_goals').select('current_amount').eq('id', id).single();
            const newAmount = (goal?.current_amount ?? 0) + amount;
            const { error } = await supabase
                .from('savings_goals')
                .update({ current_amount: newAmount })
                .eq('id', id)
                .eq('user_id', user.id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
    });
}

// ── Iconos para metas ──
const GOAL_ICONS = ['🏠', '🚗', '✈️', '📱', '🎓', '💍', '🎮', '🏥', '💰', '🎯'];

export default function GoalsScreen() {
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);
    const router = useRouter();
    const { data: goals = [], refetch, isRefetching } = useGoals();
    const [showAddModal, setShowAddModal] = useState(false);
    const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);

    const totalSaved = goals.reduce((sum: number, g: any) => sum + (g.current_amount ?? 0), 0);
    const totalTarget = goals.reduce((sum: number, g: any) => sum + (g.target_amount ?? 0), 0);

    return (
        <View style={[styles.screen, { backgroundColor: C.background.primary }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <View style={styles.header}>
                <Text style={[styles.title, { color: C.text.primary }]}>Metas de Ahorro</Text>
                <Pressable
                    onPress={() => setShowAddModal(true)}
                    style={[styles.addBtn, { backgroundColor: C.accent.primary }]}
                >
                    <Ionicons name="add" size={18} color="#FFF" />
                    <Text style={styles.addBtnText}>Nueva</Text>
                </Pressable>
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
                {/* Resumen total */}
                {goals.length > 0 && (
                    <Animated.View entering={FadeInDown.duration(500)}>
                        <GlassCard variant="elevated" padding="xl" style={styles.totalCard}>
                            <ProgressRing
                                progress={totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0}
                                size={100}
                                strokeWidth={8}
                                subText="Total"
                            />
                            <View style={styles.totalCol}>
                                <Text style={[styles.totalLabel, { color: C.text.tertiary }]}>Total Ahorrado</Text>
                                <Text style={[styles.totalAmount, { color: C.accent.success }]}>
                                    {formatCurrency(totalSaved)}
                                </Text>
                                <Text style={[styles.totalTarget, { color: C.text.tertiary }]}>
                                    de {formatCurrency(totalTarget)}
                                </Text>
                            </View>
                        </GlassCard>
                    </Animated.View>
                )}

                {/* Estado vacío */}
                {goals.length === 0 && (
                    <GlassCard variant="elevated" padding="2xl" style={styles.emptyCard}>
                        <Ionicons name="flag-outline" size={56} color={C.text.tertiary} style={{ marginBottom: SPACING.md }} />
                        <Text style={[styles.emptyTitle, { color: C.text.primary }]}>Sin metas</Text>
                        <Text style={[styles.emptyText, { color: C.text.tertiary }]}>
                            Define tus metas de ahorro y trackea tu progreso.
                        </Text>
                        <Button title="Crear Meta" onPress={() => setShowAddModal(true)} size="md" />
                    </GlassCard>
                )}

                {/* Lista de metas */}
                {goals.map((goal: any, index: number) => {
                    const percent = goal.target_amount > 0
                        ? (goal.current_amount / goal.target_amount) * 100
                        : 0;

                    return (
                        <Animated.View key={goal.id} entering={FadeInDown.duration(400).delay(index * 80)}>
                            <GlassCard
                                variant="default"
                                padding="lg"
                                style={styles.goalCard}
                                pressable
                                onPress={() => router.push(`/goal-detail/${goal.id}` as any)}
                            >
                                <View style={styles.goalHeader}>
                                    <Text style={styles.goalIcon}>{goal.icon ?? '🎯'}</Text>
                                    <View style={styles.goalInfo}>
                                        <Text style={[styles.goalName, { color: C.text.primary }]}>
                                            {goal.name}
                                        </Text>
                                        <Text style={[styles.goalDate, { color: C.text.tertiary }]}>
                                            Meta: {new Date(goal.target_date).toLocaleDateString('es-MX', {
                                                month: 'short', year: 'numeric',
                                            })}
                                        </Text>
                                    </View>
                                    <Text style={[styles.goalPercent, { color: C.accent.primary }]}>
                                        {Math.round(percent)}%
                                    </Text>
                                </View>

                                <ProgressBar progress={percent} showPercentage={false} height={8} />

                                <View style={styles.goalAmounts}>
                                    <Text style={[styles.goalCurrent, { color: C.text.primary }]}>
                                        {formatCurrency(goal.current_amount)}
                                    </Text>
                                    <Text style={[styles.goalTarget, { color: C.text.tertiary }]}>
                                        / {formatCurrency(goal.target_amount)}
                                    </Text>
                                </View>

                                {/* monthly_contribution no existe en DB — omitido */}

                                <Pressable
                                    style={styles.contributeBtn}
                                    onPress={() => setContributeGoalId(goal.id)}
                                >
                                    <Text style={[styles.contributeBtnText, { color: C.accent.primary }]}>
                                        + Abonar
                                    </Text>
                                </Pressable>
                            </GlassCard>
                        </Animated.View>
                    );
                })}

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Modales */}
            <AddGoalModal visible={showAddModal} onClose={() => setShowAddModal(false)} isDark={isDark} />
            <ContributeModal
                goalId={contributeGoalId}
                onClose={() => setContributeGoalId(null)}
                isDark={isDark}
            />
        </View>
    );
}

// ── Modales ──

function AddGoalModal({ visible, onClose, isDark }: { visible: boolean; onClose: () => void; isDark: boolean }) {
    const C = getThemeColors(isDark);
    const createGoal = useCreateGoal();
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [monthly, setMonthly] = useState('');
    const [icon, setIcon] = useState('🎯');

    const handleSave = async () => {
        if (!name.trim() || !target) return;
        const targetAmount = parseAmount(target);
        const monthlyAmount = parseAmount(monthly);
        const monthsNeeded = monthlyAmount > 0 ? Math.ceil(targetAmount / monthlyAmount) : 12;
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + monthsNeeded);

        try {
            await createGoal.mutateAsync({
                // CORRECTO: columna 'name' en savings_goals, NO 'goal_name'
                name: name.trim(),
                target_amount: targetAmount,
                target_date: targetDate.toISOString().split('T')[0],
                icon,
                // monthly_contribution no existe en el schema — se omite
            });
            setName(''); setTarget(''); setMonthly(''); setIcon('🎯');
            onClose();
        } catch (err: any) {
            const msg = err?.message ?? 'No se pudo crear la meta';
            Alert.alert('Error al guardar', msg);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kbView}>
                    <View style={[styles.modalContainer, { backgroundColor: C.background.secondary }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: C.text.primary }]}>Nueva Meta</Text>
                            <Pressable onPress={onClose}>
                                <Text style={[styles.closeBtn, { color: C.text.tertiary }]}>✕</Text>
                            </Pressable>
                        </View>

                        {/* Selector de ícono */}
                        <Text style={[styles.fieldLabel, { color: C.text.secondary }]}>Ícono</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconRow}>
                            {GOAL_ICONS.map(i => (
                                <Pressable
                                    key={i}
                                    style={[
                                        styles.iconChip,
                                        { backgroundColor: C.background.card, borderColor: C.border.secondary },
                                        icon === i && { borderColor: C.accent.primary, backgroundColor: 'rgba(108,99,255,0.15)' },
                                    ]}
                                    onPress={() => setIcon(i)}
                                >
                                    <Text style={styles.iconText}>{i}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>

                        <Input label="Nombre de la meta" placeholder="Ej: Viaje a Europa" value={name} onChangeText={setName} />
                        <Input label="Monto objetivo" placeholder="50000" value={target} onChangeText={setTarget}
                            keyboardType="decimal-pad" leftIcon={<Text style={[styles.dollarSign, { color: C.text.secondary }]}>$</Text>} />
                        <Input label="Contribución mensual" placeholder="5000" value={monthly} onChangeText={setMonthly}
                            keyboardType="decimal-pad" leftIcon={<Text style={[styles.dollarSign, { color: C.text.secondary }]}>$</Text>} />

                        <Button title="Crear Meta" onPress={handleSave} loading={createGoal.isPending}
                            fullWidth size="lg" style={styles.saveBtn} />
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

function ContributeModal({ goalId, onClose, isDark }: { goalId: string | null; onClose: () => void; isDark: boolean }) {
    const C = getThemeColors(isDark);
    const contribute = useContribute();
    const [amount, setAmount] = useState('');

    const handleSave = async () => {
        if (!goalId || !amount || parseAmount(amount) <= 0) return;
        await contribute.mutateAsync({ id: goalId, amount: parseAmount(amount) });
        setAmount('');
        onClose();
    };

    return (
        <Modal visible={!!goalId} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { backgroundColor: C.background.secondary }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: C.text.primary }]}>Abonar a Meta</Text>
                        <Pressable onPress={onClose}>
                            <Text style={[styles.closeBtn, { color: C.text.tertiary }]}>✕</Text>
                        </Pressable>
                    </View>
                    <Input label="Monto a abonar" placeholder="1000" value={amount} onChangeText={setAmount}
                        keyboardType="decimal-pad" leftIcon={<Text style={[styles.dollarSign, { color: C.text.secondary }]}>$</Text>} />
                    <Button title="Abonar" onPress={handleSave} loading={contribute.isPending}
                        fullWidth size="lg" style={styles.saveBtn} />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: SPACING['5xl'], paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg,
    },
    title: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size['2xl'] },
    addBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full,
    },
    addBtnText: { fontFamily: TYPOGRAPHY.family.semibold, fontSize: TYPOGRAPHY.size.sm, color: '#FFFFFF' },
    // Total
    totalCard: { marginBottom: SPACING.lg, flexDirection: 'row', alignItems: 'center' },
    totalCol: { flex: 1, marginLeft: SPACING.xl },
    totalLabel: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.sm },
    totalAmount: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size['2xl'] },
    totalTarget: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.sm },
    // Empty
    emptyCard: { alignItems: 'center', marginTop: SPACING['4xl'] },
    emptyTitle: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xl },
    emptyText: {
        fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.md,
        textAlign: 'center', marginVertical: SPACING.sm,
    },
    // Goal card
    goalCard: { marginBottom: SPACING.md },
    goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
    goalIcon: { fontSize: 32, marginRight: SPACING.md },
    goalInfo: { flex: 1 },
    goalName: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.lg },
    goalDate: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs },
    goalPercent: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xl },
    goalAmounts: { flexDirection: 'row', alignItems: 'baseline', marginTop: SPACING.sm },
    goalCurrent: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md },
    goalTarget: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.sm, marginLeft: 4 },
    goalContrib: {
        fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs, marginTop: SPACING.sm,
    },
    contributeBtn: {
        marginTop: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: RADIUS.md, backgroundColor: 'rgba(108,99,255,0.1)', alignItems: 'center',
    },
    contributeBtnText: { fontFamily: TYPOGRAPHY.family.semibold, fontSize: TYPOGRAPHY.size.sm },
    // Modales
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    kbView: { flex: 1, justifyContent: 'flex-end' },
    modalContainer: {
        borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'],
        padding: SPACING.xl,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: SPACING.xl,
    },
    modalTitle: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xl },
    closeBtn: { fontSize: 22, padding: SPACING.sm },
    fieldLabel: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm, marginBottom: SPACING.sm },
    iconRow: { marginBottom: SPACING.lg, flexGrow: 0 },
    iconChip: {
        width: 44, height: 44, borderRadius: 22, alignItems: 'center',
        justifyContent: 'center', borderWidth: 1.5, marginRight: SPACING.sm,
    },
    iconText: { fontSize: 22 },
    dollarSign: { fontFamily: TYPOGRAPHY.family.semibold, fontSize: 16 },
    saveBtn: { marginTop: SPACING.md, marginBottom: SPACING['2xl'] },
    bottomSpacer: { height: 20 },
});
