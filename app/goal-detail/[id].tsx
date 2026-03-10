/**
 * Goal Detail Screen — Detalle de meta de ahorro
 * Progreso visual, historial de abonos y botón de contribuir
 * Ruta: app/goal-detail/[id].tsx
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Modal,
    RefreshControl,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GlassCard, ProgressRing, ProgressBar, Button } from '../../src/components/ui';
import { supabase } from '../../src/services/supabase';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { formatCurrency, parseAmount } from '../../src/utils/formatters';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

// ── Hooks locales ──

function useGoalDetail(id: string) {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['goals', id],
        queryFn: async () => {
            if (!user) return null;
            const { data, error } = await supabase
                .from('savings_goals')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!user && !!id,
    });
}

function useGoalEntries(goalId: string) {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['goal_entries', goalId],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('savings_entries')
                .select('*')
                .eq('goal_id', goalId)
                .eq('user_id', user.id)
                .order('entry_date', { ascending: false })
                .limit(20);
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user && !!goalId,
    });
}

function useContribute(goalId: string) {
    const qc = useQueryClient();
    const { user } = useAuthStore();
    return useMutation({
        mutationFn: async (amount: number) => {
            if (!user) throw new Error('No autenticado');
            // Insertar entrada de ahorro
            const { error: entryErr } = await supabase
                .from('savings_entries')
                .insert({
                    goal_id: goalId,
                    user_id: user.id,
                    amount,
                    entry_date: new Date().toISOString().split('T')[0],
                });
            if (entryErr) throw entryErr;
            // Actualizar current_amount en la meta
            const { data: goal } = await supabase
                .from('savings_goals')
                .select('current_amount')
                .eq('id', goalId)
                .single();
            await supabase
                .from('savings_goals')
                .update({ current_amount: (goal?.current_amount ?? 0) + amount })
                .eq('id', goalId)
                .eq('user_id', user.id);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['goals', goalId] });
            qc.invalidateQueries({ queryKey: ['goals'] });
            qc.invalidateQueries({ queryKey: ['goal_entries', goalId] });
        },
    });
}

export default function GoalDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);
    const [showContributeModal, setShowContributeModal] = useState(false);

    const { data: goal, isLoading, refetch, isRefetching } = useGoalDetail(id ?? '');
    const { data: entries = [] } = useGoalEntries(id ?? '');

    if (isLoading || !goal) {
        return (
            <View style={[styles.screen, { backgroundColor: C.background.primary, justifyContent: 'center', alignItems: 'center' }]}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <Text style={[styles.emptyText, { color: C.text.tertiary }]}>Cargando...</Text>
            </View>
        );
    }

    const percent = goal.target_amount > 0
        ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
        : 0;

    const remaining = Math.max(0, goal.target_amount - goal.current_amount);
    // monthly_contribution no existe en el schema de savings_goals.
    // La proyección de meses se elimina para evitar errores.

    return (
        <View style={[styles.screen, { backgroundColor: C.background.primary }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={C.text.primary} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: C.text.primary }]}>
                    {goal.icon ?? '🎯'} {goal.name}
                </Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.accent.primary} />
                }
            >
                {/* Resumen con anillo */}
                <Animated.View entering={FadeInDown.duration(400)}>
                    <GlassCard variant="elevated" padding="xl" style={styles.summaryCard}>
                        <View style={styles.ringRow}>
                            <ProgressRing progress={percent} size={120} strokeWidth={10} subText="Logrado" />
                            <View style={styles.summaryCol}>
                                <Text style={[styles.amountLabel, { color: C.text.tertiary }]}>Ahorrado</Text>
                                <Text style={[styles.amountValue, { color: C.accent.success }]}>
                                    {formatCurrency(goal.current_amount)}
                                </Text>
                                <Text style={[styles.amountLabel, { color: C.text.tertiary, marginTop: SPACING.sm }]}>Meta total</Text>
                                <Text style={[styles.amountValue, { color: C.text.primary, fontSize: TYPOGRAPHY.size.lg }]}>
                                    {formatCurrency(goal.target_amount)}
                                </Text>
                                {remaining > 0 && (
                                    <>
                                        <Text style={[styles.amountLabel, { color: C.text.tertiary, marginTop: SPACING.sm }]}>Falta</Text>
                                        <Text style={[styles.amountValue, { color: C.accent.warning, fontSize: TYPOGRAPHY.size.md }]}>
                                            {formatCurrency(remaining)}
                                        </Text>
                                    </>
                                )}
                            </View>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* Proyección: solo fecha meta si existe */}
                {goal.target_date && (
                    <Animated.View entering={FadeInDown.duration(400).delay(80)}>
                        <GlassCard variant="default" padding="lg" style={styles.sectionCard}>
                            <Text style={[styles.sectionTitle, { color: C.text.primary }]}>Proyección</Text>
                            <View style={styles.projRow}>
                                <View style={styles.projItem}>
                                    <Ionicons name="calendar-outline" size={18} color={C.accent.success} />
                                    <Text style={[styles.projValue, { color: C.text.primary }]}>
                                        {new Date(goal.target_date).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                                    </Text>
                                    <Text style={[styles.projLabel, { color: C.text.tertiary }]}>
                                        fecha meta
                                    </Text>
                                </View>
                                <View style={styles.projItem}>
                                    <Ionicons name="trending-up-outline" size={18} color={C.accent.info} />
                                    <Text style={[styles.projValue, { color: C.text.primary }]}>
                                        {formatCurrency(remaining)}
                                    </Text>
                                    <Text style={[styles.projLabel, { color: C.text.tertiary }]}>
                                        por ahorrar
                                    </Text>
                                </View>
                            </View>
                        </GlassCard>
                    </Animated.View>
                )}

                {/* Barra de progreso */}
                <Animated.View entering={FadeInDown.duration(400).delay(120)}>
                    <GlassCard variant="default" padding="lg" style={styles.sectionCard}>
                        <ProgressBar
                            progress={percent}
                            label={`${Math.round(percent)}% completado`}
                            showPercentage
                            height={10}
                        />
                    </GlassCard>
                </Animated.View>

                {/* Botón de abonar */}
                <Animated.View entering={FadeInDown.duration(400).delay(140)}>
                    <Pressable
                        style={[styles.contributeBtn, { backgroundColor: C.accent.primary, ...SHADOWS.floating }]}
                        onPress={() => setShowContributeModal(true)}
                    >
                        <Ionicons name="add-circle-outline" size={22} color="#FFF" />
                        <Text style={styles.contributeBtnText}>Abonar a esta meta</Text>
                    </Pressable>
                </Animated.View>

                {/* Historial de abonos */}
                <Animated.View entering={FadeInDown.duration(400).delay(180)}>
                    <GlassCard variant="default" padding="lg" style={styles.sectionCard}>
                        <Text style={[styles.sectionTitle, { color: C.text.primary }]}>Historial de abonos</Text>
                        {entries.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="wallet-outline" size={36} color={C.text.tertiary} />
                                <Text style={[styles.emptyText, { color: C.text.tertiary }]}>
                                    Aún no hay abonos registrados
                                </Text>
                            </View>
                        ) : (
                            entries.map((entry: any) => (
                                <View key={entry.id} style={[styles.entryRow, { borderBottomColor: C.border.secondary }]}>
                                    <View style={styles.entryLeft}>
                                        <View style={[styles.entryIcon, { backgroundColor: `${C.accent.success}20` }]}>
                                            <Ionicons name="arrow-up" size={14} color={C.accent.success} />
                                        </View>
                                        <Text style={[styles.entryDate, { color: C.text.secondary }]}>
                                            {new Date(entry.entry_date).toLocaleDateString('es-MX', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                            })}
                                        </Text>
                                    </View>
                                    <Text style={[styles.entryAmount, { color: C.accent.success }]}>
                                        +{formatCurrency(entry.amount)}
                                    </Text>
                                </View>
                            ))
                        )}
                    </GlassCard>
                </Animated.View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Modal de contribución */}
            <ContributeModal
                visible={showContributeModal}
                onClose={() => setShowContributeModal(false)}
                goalId={id ?? ''}
                isDark={isDark}
            />
        </View>
    );
}

function ContributeModal({ visible, onClose, goalId, isDark }: {
    visible: boolean; onClose: () => void; goalId: string; isDark: boolean;
}) {
    const C = getThemeColors(isDark);
    const contribute = useContribute(goalId);
    const [amount, setAmount] = useState('');

    const handleSave = async () => {
        const num = parseAmount(amount);
        if (isNaN(num) || num <= 0) { Alert.alert('Error', 'Ingresa un monto válido'); return; }
        await contribute.mutateAsync(num);
        setAmount('');
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kbView}>
                    <View style={[styles.modalContainer, { backgroundColor: C.background.secondary }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: C.text.primary }]}>Abonar a meta</Text>
                            <Pressable onPress={onClose}>
                                <Text style={[styles.closeBtn, { color: C.text.tertiary }]}>✕</Text>
                            </Pressable>
                        </View>
                        <View style={[styles.amountRow, { backgroundColor: C.background.tertiary }]}>
                            <Text style={[styles.amountPrefix, { color: C.accent.primary }]}>$</Text>
                            <TextInput
                                style={[styles.amountInput, { color: C.text.primary }]}
                                placeholder="0.00"
                                placeholderTextColor={C.text.tertiary}
                                keyboardType="decimal-pad"
                                value={amount}
                                onChangeText={setAmount}
                                autoFocus
                            />
                        </View>
                        <Button
                            title="Abonar"
                            onPress={handleSave}
                            loading={contribute.isPending}
                            fullWidth
                            size="lg"
                            style={{ marginTop: SPACING.lg, marginBottom: SPACING['2xl'] }}
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
        flexDirection: 'row', alignItems: 'center',
        paddingTop: SPACING['4xl'], paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg,
    },
    backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
    headerTitle: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xl, flex: 1 },
    summaryCard: { marginBottom: SPACING.lg },
    ringRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xl },
    summaryCol: { flex: 1 },
    amountLabel: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs },
    amountValue: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size['2xl'] },
    sectionCard: { marginBottom: SPACING.md },
    sectionTitle: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.lg, marginBottom: SPACING.md },
    projRow: { flexDirection: 'row', justifyContent: 'space-around' },
    projItem: { alignItems: 'center', gap: 4 },
    projValue: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md },
    projLabel: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs },
    contributeBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: SPACING.sm, paddingVertical: SPACING.lg, borderRadius: RADIUS.xl, marginBottom: SPACING.md,
    },
    contributeBtnText: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md, color: '#FFF' },
    entryRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: SPACING.sm, borderBottomWidth: 1,
    },
    entryLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    entryIcon: { width: 28, height: 28, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
    entryDate: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm },
    entryAmount: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.sm },
    emptyState: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
    emptyText: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.md, textAlign: 'center' },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    kbView: { flex: 1, justifyContent: 'flex-end' },
    modalContainer: { borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], padding: SPACING.xl },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
    modalTitle: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xl },
    closeBtn: { fontSize: 22, padding: SPACING.sm },
    amountRow: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg },
    amountPrefix: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size['2xl'], marginRight: SPACING.sm },
    amountInput: { flex: 1, fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size['2xl'], paddingVertical: SPACING.lg },
    bottomSpacer: { height: 20 },
});
