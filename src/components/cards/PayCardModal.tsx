/**
 * PayCardModal — Modal para registrar un pago a tarjeta de crédito
 * SmartWallet UI: botones rápidos (mínimo/sin intereses/total),
 * monto custom, historial reciente de pagos. Tema reactivo.
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    ScrollView,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCreatePayment, useCardPayments, getPaymentAmounts } from '../../hooks/useCardPayments';
import { formatCurrency, parseAmount } from '../../utils/formatters';
import { useThemeStore } from '../../store/themeStore';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import type { CreditCard } from '../../types/database';

interface PayCardModalProps {
    visible: boolean;
    onClose: () => void;
    card: CreditCard;
}

type PaymentType = 'minimum' | 'no_interest' | 'full' | 'custom';

export function PayCardModal({ visible, onClose, card }: PayCardModalProps) {
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);
    const [selectedType, setSelectedType] = useState<PaymentType>('full');
    const [customAmount, setCustomAmount] = useState('');
    const [notes, setNotes] = useState('');

    const createPayment = useCreatePayment();
    const { data: recentPayments = [] } = useCardPayments(card.id);
    const amounts = getPaymentAmounts(card);

    const getSelectedAmount = (): number => {
        switch (selectedType) {
            case 'minimum': return amounts.minimum;
            case 'no_interest': return amounts.noInterest;
            case 'full': return amounts.full;
            case 'custom': return parseAmount(customAmount);
        }
    };

    const handlePay = async () => {
        const payAmount = getSelectedAmount();
        if (payAmount <= 0) { Alert.alert('Error', 'Ingresa un monto válido'); return; }
        try {
            await createPayment.mutateAsync({
                card_id: card.id,
                amount_paid: payAmount,
                payment_type: selectedType,
                notes: notes.trim() || undefined,
            });
            setCustomAmount(''); setNotes('');
            onClose();
        } catch { Alert.alert('Error', 'No se pudo registrar el pago'); }
    };

    const typeLabels: Record<PaymentType, string> = {
        minimum: 'Pago mínimo',
        no_interest: 'Sin intereses',
        full: 'Pago total',
        custom: 'Personalizado',
    };

    const typeIcons: Record<PaymentType, keyof typeof Ionicons.glyphMap> = {
        minimum: 'remove-circle-outline',
        no_interest: 'shield-checkmark-outline',
        full: 'checkmark-done-circle-outline',
        custom: 'create-outline',
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: C.background.card }]}>
                    {/* ── Header ── */}
                    <View style={styles.header}>
                        <View>
                            <Text style={[styles.headerTitle, { color: C.text.primary }]}>Registrar Pago</Text>
                            <Text style={[styles.headerSub, { color: C.text.tertiary }]}>
                                {card.card_alias ?? card.bank_name} •••• {card.last_four_digits}
                            </Text>
                        </View>
                        <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: C.background.tertiary }]}>
                            <Ionicons name="close" size={22} color={C.text.secondary} />
                        </Pressable>
                    </View>

                    {/* ── Balance actual ── */}
                    <View style={[styles.balanceCard, { backgroundColor: C.background.tertiary }]}>
                        <Text style={[styles.balanceLabel, { color: C.text.tertiary }]}>SALDO ACTUAL</Text>
                        <Text style={[styles.balanceAmount, { color: C.text.primary }]}>
                            {formatCurrency(card.current_balance)}
                        </Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* ── Tipos de pago ── */}
                        <Text style={[styles.label, { color: C.text.tertiary }]}>TIPO DE PAGO</Text>

                        {amounts.minimum > 0 && (
                            <PaymentTypeButton
                                type="minimum"
                                label={typeLabels.minimum}
                                amount={amounts.minimum}
                                icon={typeIcons.minimum}
                                selected={selectedType === 'minimum'}
                                onPress={() => setSelectedType('minimum')}
                                isDark={isDark}
                            />
                        )}
                        {amounts.noInterest > 0 && (
                            <PaymentTypeButton
                                type="no_interest"
                                label={typeLabels.no_interest}
                                amount={amounts.noInterest}
                                icon={typeIcons.no_interest}
                                selected={selectedType === 'no_interest'}
                                onPress={() => setSelectedType('no_interest')}
                                isDark={isDark}
                            />
                        )}
                        <PaymentTypeButton
                            type="full"
                            label={typeLabels.full}
                            amount={amounts.full}
                            icon={typeIcons.full}
                            selected={selectedType === 'full'}
                            onPress={() => setSelectedType('full')}
                            isDark={isDark}
                        />

                        {/* Personalizado */}
                        <Pressable
                            style={[
                                styles.typeBtn,
                                { backgroundColor: C.background.tertiary },
                                selectedType === 'custom' && { borderColor: C.accent.primary, backgroundColor: C.iconContainer.primary },
                            ]}
                            onPress={() => setSelectedType('custom')}
                        >
                            <View style={styles.typeLeft}>
                                <View style={[
                                    styles.typeIcon,
                                    { backgroundColor: selectedType === 'custom' ? C.accent.primary : C.iconContainer.primary },
                                ]}>
                                    <Ionicons
                                        name="create-outline"
                                        size={18}
                                        color={selectedType === 'custom' ? '#FFF' : C.iconContainer.primaryText}
                                    />
                                </View>
                                <Text style={[styles.typeLabel, { color: C.text.primary }]}>Personalizado</Text>
                            </View>
                            {selectedType === 'custom' && (
                                <Ionicons name="checkmark-circle" size={20} color={C.accent.primary} />
                            )}
                        </Pressable>

                        {selectedType === 'custom' && (
                            <View style={[styles.customAmountContainer, { backgroundColor: C.background.tertiary }]}>
                                <Text style={[styles.customPrefix, { color: C.accent.primary }]}>$</Text>
                                <TextInput
                                    style={[styles.customInput, { color: C.text.primary }]}
                                    placeholder="0.00"
                                    placeholderTextColor={C.text.tertiary}
                                    keyboardType="decimal-pad"
                                    value={customAmount}
                                    onChangeText={setCustomAmount}
                                    autoFocus
                                />
                            </View>
                        )}

                        {/* Notas */}
                        <Text style={[styles.label, { color: C.text.tertiary }]}>NOTAS (OPCIONAL)</Text>
                        <View style={[styles.notesContainer, { backgroundColor: C.background.tertiary }]}>
                            <TextInput
                                style={[styles.notesInput, { color: C.text.primary }]}
                                placeholder="Ej: Pago desde BBVA"
                                placeholderTextColor={C.text.tertiary}
                                value={notes}
                                onChangeText={setNotes}
                            />
                        </View>

                        {/* Historial reciente */}
                        {recentPayments.length > 0 && (
                            <>
                                <Text style={[styles.label, { color: C.text.tertiary }]}>PAGOS RECIENTES</Text>
                                {recentPayments.slice(0, 3).map((payment) => (
                                    <View key={payment.id} style={styles.historyRow}>
                                        <View style={styles.historyLeft}>
                                            <Ionicons name="checkmark-circle" size={16} color={C.accent.success} />
                                            <Text style={[styles.historyDate, { color: C.text.secondary }]}>
                                                {new Date(payment.payment_date).toLocaleDateString('es-MX', {
                                                    day: 'numeric', month: 'short',
                                                })}
                                            </Text>
                                        </View>
                                        <Text style={[styles.historyAmount, { color: C.accent.success }]}>
                                            {formatCurrency(payment.amount_paid)}
                                        </Text>
                                    </View>
                                ))}
                            </>
                        )}
                    </ScrollView>

                    {/* ── Botón confirmar ── */}
                    <Pressable
                        style={[
                            styles.payBtn,
                            { backgroundColor: C.accent.primary },
                            createPayment.isPending && styles.payBtnDisabled,
                        ]}
                        onPress={handlePay}
                        disabled={createPayment.isPending}
                    >
                        <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.payBtnText}>
                            {createPayment.isPending
                                ? 'Procesando...'
                                : `Pagar ${formatCurrency(getSelectedAmount())}`}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

// ── Componente auxiliar ──

interface PaymentTypeBtnProps {
    type: PaymentType;
    label: string;
    amount: number;
    icon: keyof typeof Ionicons.glyphMap;
    selected: boolean;
    isDark: boolean;
    onPress: () => void;
}

function PaymentTypeButton({ label, amount, icon, selected, isDark, onPress }: PaymentTypeBtnProps) {
    const C = getThemeColors(isDark);
    return (
        <Pressable
            style={[
                styles.typeBtn,
                { backgroundColor: C.background.tertiary },
                selected && { borderColor: C.accent.primary, backgroundColor: C.iconContainer.primary },
            ]}
            onPress={onPress}
        >
            <View style={styles.typeLeft}>
                <View style={[
                    styles.typeIcon,
                    { backgroundColor: selected ? C.accent.primary : C.iconContainer.primary },
                ]}>
                    <Ionicons name={icon} size={18} color={selected ? '#FFFFFF' : C.iconContainer.primaryText} />
                </View>
                <View>
                    <Text style={[styles.typeLabel, { color: C.text.primary }]}>{label}</Text>
                    <Text style={[styles.typeAmount, { color: C.accent.primary }]}>{formatCurrency(amount)}</Text>
                </View>
            </View>
            {selected && <Ionicons name="checkmark-circle" size={20} color={C.accent.primary} />}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContainer: {
        borderTopLeftRadius: RADIUS['4xl'],
        borderTopRightRadius: RADIUS['4xl'],
        maxHeight: '90%',
        paddingTop: SPACING.xl,
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING['2xl'],
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: SPACING.lg,
    },
    headerTitle: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.xl,
        letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    },
    headerSub: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm, marginTop: 2 },
    closeBtn: { width: 36, height: 36, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center' },
    balanceCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.lg },
    balanceLabel: {
        fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xs,
        letterSpacing: TYPOGRAPHY.letterSpacing.widest, textTransform: 'uppercase',
    },
    balanceAmount: {
        fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size['3xl'],
        letterSpacing: TYPOGRAPHY.letterSpacing.tighter, marginTop: SPACING.xs,
    },
    label: {
        fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xs,
        letterSpacing: TYPOGRAPHY.letterSpacing.widest, textTransform: 'uppercase',
        marginBottom: SPACING.sm, marginTop: SPACING.lg, marginLeft: SPACING.xs,
    },
    typeBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md, marginBottom: SPACING.sm,
        borderWidth: 1.5, borderColor: 'transparent',
    },
    typeLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    typeIcon: { width: 36, height: 36, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center' },
    typeLabel: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.md },
    typeAmount: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.sm, marginTop: 2 },
    customAmountContainer: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    },
    customPrefix: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size['2xl'], marginRight: SPACING.sm },
    customInput: {
        flex: 1, fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size['2xl'], paddingVertical: SPACING.md,
        letterSpacing: TYPOGRAPHY.letterSpacing.tighter,
    },
    notesContainer: { borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg },
    notesInput: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.md, paddingVertical: SPACING.md },
    historyRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: SPACING.sm, paddingHorizontal: SPACING.xs,
    },
    historyLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    historyDate: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm },
    historyAmount: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.sm },
    payBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: SPACING.sm, borderRadius: RADIUS.lg, paddingVertical: SPACING.lg,
        marginTop: SPACING.lg, ...SHADOWS.floating,
    },
    payBtnDisabled: { opacity: 0.5 },
    payBtnText: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md, color: '#FFFFFF' },
});
