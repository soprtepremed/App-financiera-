/**
 * AddExpenseModal — Modal para registrar un nuevo gasto
 * SmartWallet UI: rounded-[3rem] modal, labels uppercase, indigo buttons.
 * Tema reactivo — usa useThemeStore internamente.
 */
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    ScrollView,
    TextInput,
    Switch,
    Alert,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryPicker } from './CategoryPicker';
import { useCards } from '../../hooks/useCards';
import { useCreateExpense } from '../../hooks/useExpenses';
import { useThemeStore } from '../../store/themeStore';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import type { ExpenseCategory, CreditCard } from '../../types/database';
import { parseAmount } from '../../utils/formatters';

interface Props {
    visible: boolean;
    onClose: () => void;
    /** Pre-seleccionar tarjeta (desde la pantalla de tarjetas) */
    preselectedCardId?: string;
}

export function AddExpenseModal({ visible, onClose, preselectedCardId }: Props) {
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(preselectedCardId ?? null);
    const [isRecurring, setIsRecurring] = useState(false);
    const [showCategories, setShowCategories] = useState(false);

    const { data: cards = [] } = useCards();
    const createExpense = useCreateExpense();

    const resetForm = () => {
        setAmount('');
        setDescription('');
        setSelectedCategory(null);
        setSelectedCardId(preselectedCardId ?? null);
        setIsRecurring(false);
        setShowCategories(false);
    };

    const handleClose = () => { resetForm(); onClose(); };

    // Guard contra doble-click
    const savingRef = useRef(false);

    const handleSave = async () => {
        if (savingRef.current) return;
        const numAmount = parseAmount(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            Alert.alert('Error', 'Ingresa un monto válido'); return;
        }
        if (!selectedCategory) {
            Alert.alert('Error', 'Selecciona una categoría'); return;
        }
        savingRef.current = true;
        try {
            await createExpense.mutateAsync({
                amount: numAmount,
                description: description.trim() || 'Sin descripción',
                category_id: selectedCategory.id,
                card_id: selectedCardId || null,
                expense_date: new Date().toISOString().split('T')[0],
                is_recurring: isRecurring,
            });
            handleClose();
        } catch (err: any) {
            const msg = err?.message ?? 'No se pudo registrar el gasto';
            Alert.alert('Error al guardar', msg);
        } finally {
            savingRef.current = false;
        }
    };

    const { height: windowHeight } = useWindowDimensions();
    const modalMaxHeight = Platform.OS === 'web'
        ? Math.min(windowHeight * 0.85, 700)
        : '90%';

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <Pressable style={styles.overlayTouchable} onPress={handleClose} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.keyboardView}
                >
                    <View style={[
                        styles.modalContainer,
                        { backgroundColor: C.background.card, maxHeight: modalMaxHeight },
                        Platform.OS === 'web' && styles.containerWeb,
                    ]}>
                        {/* ── Header ── */}
                        <View style={styles.header}>
                            <Text style={[styles.headerTitle, { color: C.text.primary }]}>Nuevo Gasto</Text>
                            <Pressable
                                onPress={handleClose}
                                style={[styles.closeBtn, { backgroundColor: C.background.tertiary }]}
                            >
                                <Ionicons name="close" size={22} color={C.text.secondary} />
                            </Pressable>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {/* ── Monto ── */}
                            <Text style={[styles.label, { color: C.text.tertiary }]}>MONTO</Text>
                            <View style={[styles.amountContainer, { backgroundColor: C.background.tertiary }]}>
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

                            {/* ── Descripción ── */}
                            <Text style={[styles.label, { color: C.text.tertiary }]}>DESCRIPCIÓN</Text>
                            <View style={[styles.inputContainer, { backgroundColor: C.background.tertiary }]}>
                                <Ionicons name="create-outline" size={18} color={C.text.tertiary} />
                                <TextInput
                                    style={[styles.textInput, { color: C.text.primary }]}
                                    placeholder="¿En qué gastaste?"
                                    placeholderTextColor={C.text.tertiary}
                                    value={description}
                                    onChangeText={setDescription}
                                />
                            </View>

                            {/* ── Categoría ── */}
                            <Text style={[styles.label, { color: C.text.tertiary }]}>CATEGORÍA</Text>
                            {showCategories ? (
                                <CategoryPicker
                                    selectedId={selectedCategory?.id}
                                    onSelect={(cat) => {
                                        setSelectedCategory(cat);
                                        setShowCategories(false);
                                    }}
                                />
                            ) : (
                                <Pressable
                                    style={[styles.selectorBtn, { backgroundColor: C.background.tertiary }]}
                                    onPress={() => setShowCategories(true)}
                                >
                                    {selectedCategory ? (
                                        <View style={styles.selectedRow}>
                                            <View style={[styles.catDot, { backgroundColor: selectedCategory.color }]} />
                                            <Text style={[styles.selectedText, { color: C.text.primary }]}>
                                                {selectedCategory.name}
                                            </Text>
                                        </View>
                                    ) : (
                                        <Text style={[styles.placeholderText, { color: C.text.tertiary }]}>
                                            Seleccionar categoría
                                        </Text>
                                    )}
                                    <Ionicons name="chevron-forward" size={18} color={C.text.tertiary} />
                                </Pressable>
                            )}

                            {/* ── Medio de pago ── */}
                            <Text style={[styles.label, { color: C.text.tertiary }]}>MEDIO DE PAGO</Text>

                            {/* Efectivo/Débito */}
                            <Pressable
                                style={[
                                    styles.paymentOption,
                                    { backgroundColor: C.background.tertiary },
                                    !selectedCardId && { borderColor: C.accent.primary, backgroundColor: C.iconContainer.primary },
                                ]}
                                onPress={() => setSelectedCardId(null)}
                            >
                                <View style={styles.paymentLeft}>
                                    <View style={[styles.paymentIcon, { backgroundColor: C.iconContainer.success }]}>
                                        <Ionicons name="cash-outline" size={18} color={C.iconContainer.successText} />
                                    </View>
                                    <Text style={[styles.paymentText, { color: C.text.primary }]}>
                                        Efectivo / Débito
                                    </Text>
                                </View>
                                {!selectedCardId && (
                                    <Ionicons name="checkmark-circle" size={20} color={C.accent.primary} />
                                )}
                            </Pressable>

                            {/* Tarjetas de crédito */}
                            {cards.map((card: CreditCard) => (
                                <Pressable
                                    key={card.id}
                                    style={[
                                        styles.paymentOption,
                                        { backgroundColor: C.background.tertiary },
                                        selectedCardId === card.id && {
                                            borderColor: C.accent.primary,
                                            backgroundColor: C.iconContainer.primary,
                                        },
                                    ]}
                                    onPress={() => setSelectedCardId(card.id)}
                                >
                                    <View style={styles.paymentLeft}>
                                        <View style={[
                                            styles.paymentIcon,
                                            { backgroundColor: `${card.card_color}20` },
                                        ]}>
                                            <Ionicons name="card-outline" size={18} color={card.card_color} />
                                        </View>
                                        <View>
                                            <Text style={[styles.paymentText, { color: C.text.primary }]}>
                                                {card.card_alias ?? card.bank_name}
                                            </Text>
                                            <Text style={[styles.paymentSub, { color: C.text.tertiary }]}>
                                                •••• {card.last_four_digits}
                                            </Text>
                                        </View>
                                    </View>
                                    {selectedCardId === card.id && (
                                        <Ionicons name="checkmark-circle" size={20} color={C.accent.primary} />
                                    )}
                                </Pressable>
                            ))}

                            {/* ── Recurrente ── */}
                            <View style={styles.toggleRow}>
                                <View style={styles.toggleLeft}>
                                    <Ionicons name="repeat-outline" size={18} color={C.text.secondary} />
                                    <Text style={[styles.toggleLabel, { color: C.text.secondary }]}>
                                        Gasto recurrente
                                    </Text>
                                </View>
                                <Switch
                                    value={isRecurring}
                                    onValueChange={setIsRecurring}
                                    trackColor={{
                                        false: C.background.tertiary,
                                        true: C.accent.primary,
                                    }}
                                    thumbColor="#FFFFFF"
                                />
                            </View>
                        </ScrollView>

                        {/* ── Botón guardar ── */}
                        <Pressable
                            style={[
                                styles.saveBtn,
                                { backgroundColor: C.accent.primary, ...SHADOWS.floating },
                                createExpense.isPending && styles.saveBtnDisabled,
                            ]}
                            onPress={handleSave}
                            disabled={createExpense.isPending}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                            <Text style={styles.saveBtnText}>
                                {createExpense.isPending ? 'Guardando...' : 'Registrar Gasto'}
                            </Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    overlayTouchable: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    keyboardView: {
        width: '100%',
        maxWidth: 500,
        maxHeight: '90%',
    },
    modalContainer: {
        borderRadius: RADIUS['2xl'],
        paddingTop: SPACING.xl,
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING['2xl'],
        overflow: 'hidden',
    },
    containerWeb: {
        alignSelf: 'center' as any,
        width: '100%',
        maxWidth: 500,
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: SPACING.xl,
    },
    headerTitle: {
        fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xl,
        letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    },
    closeBtn: { width: 36, height: 36, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: SPACING.lg },
    label: {
        fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xs,
        letterSpacing: TYPOGRAPHY.letterSpacing.widest, textTransform: 'uppercase',
        marginBottom: SPACING.sm, marginTop: SPACING.lg,
    },
    amountContainer: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg,
    },
    amountPrefix: {
        fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size['3xl'], marginRight: SPACING.sm,
    },
    amountInput: {
        flex: 1, fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size['3xl'],
        paddingVertical: SPACING.lg, letterSpacing: TYPOGRAPHY.letterSpacing.tighter,
    },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, gap: SPACING.sm,
    },
    textInput: {
        flex: 1, fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.md, paddingVertical: SPACING.md,
    },
    selectorBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    },
    selectedRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    catDot: { width: 12, height: 12, borderRadius: 6 },
    selectedText: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.md },
    placeholderText: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.md },
    paymentOption: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
        marginBottom: SPACING.sm, borderWidth: 1.5, borderColor: 'transparent',
    },
    paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    paymentIcon: { width: 36, height: 36, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center' },
    paymentText: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.md },
    paymentSub: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs, marginTop: 2 },
    toggleRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginTop: SPACING.lg, paddingHorizontal: SPACING.xs,
    },
    toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    toggleLabel: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.md },
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: SPACING.sm, borderRadius: RADIUS.lg, paddingVertical: SPACING.lg,
    },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md, color: '#FFFFFF' },
});
