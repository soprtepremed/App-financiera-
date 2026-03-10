/**
 * AddCardModal - Modal para agregar/editar tarjeta de crédito
 * Formulario completo con validación, pago mínimo/sin intereses,
 * y UI responsiva que funciona correctamente en web y móvil.
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
    Alert,
} from 'react-native';
import { Button, Input, GlassCard } from '../ui';
import { useCreateCard, useUpdateCard, type CardFormData } from '../../hooks/useCards';
import { validateRequired, validateLastFourDigits } from '../../utils/validators';
import { useThemeStore } from '../../store/themeStore';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import type { CreditCard } from '../../types/database';

// ── Colores de bancos mexicanos ──
const BANK_COLORS: Record<string, string> = {
    'BBVA': '#004481',
    'Banorte': '#EB0029',
    'Santander': '#EC0000',
    'HSBC': '#DB0011',
    'Citibanamex': '#056DAE',
    'Scotiabank': '#EC111A',
    'Nu': '#820AD1',
    'Hey Banco': '#00C389',
    'Rappi': '#FF441F',
    'AMEX': '#006FCF',
    'Liverpool': '#E91E63',
    'Otro': '#6C63FF',
};

interface Props {
    visible: boolean;
    onClose: () => void;
    editCard?: CreditCard | null;
}

export function AddCardModal({ visible, onClose, editCard }: Props) {
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);
    const { height: windowHeight } = useWindowDimensions();
    const createCard = useCreateCard();
    const updateCard = useUpdateCard();
    const isEditing = !!editCard;

    // ── Estado del formulario ──
    const [form, setForm] = useState<CardFormData>({
        bank_name: '',
        card_alias: '',
        last_four_digits: '',
        credit_limit: 0,
        current_balance: 0,
        cut_off_day: 1,
        payment_due_day: 20,
        minimum_payment: 0,
        no_interest_payment: 0,
        card_color: '#6C63FF',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Pre-llenar si es edición
    useEffect(() => {
        if (editCard) {
            setForm({
                bank_name: editCard.bank_name,
                card_alias: editCard.card_alias ?? '',
                last_four_digits: editCard.last_four_digits,
                credit_limit: editCard.credit_limit,
                current_balance: editCard.current_balance,
                cut_off_day: editCard.cut_off_day,
                payment_due_day: editCard.payment_due_day,
                minimum_payment: (editCard as any).minimum_payment ?? 0,
                no_interest_payment: (editCard as any).no_interest_payment ?? 0,
                card_color: editCard.card_color ?? '#6C63FF',
            });
        } else {
            resetForm();
        }
    }, [editCard, visible]);

    const resetForm = () => {
        setForm({
            bank_name: '', card_alias: '', last_four_digits: '',
            credit_limit: 0, current_balance: 0, cut_off_day: 1,
            payment_due_day: 20, minimum_payment: 0, no_interest_payment: 0,
            card_color: '#6C63FF',
        });
        setErrors({});
    };

    const updateField = (field: keyof CardFormData, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const handleSave = async () => {
        const newErrors: Record<string, string> = {};
        const bankVal = validateRequired(form.bank_name, 'El banco');
        if (!bankVal.isValid) newErrors.bank_name = bankVal.error!;
        const digitsVal = validateLastFourDigits(form.last_four_digits);
        if (!digitsVal.isValid) newErrors.last_four_digits = digitsVal.error!;
        if (form.credit_limit <= 0) newErrors.credit_limit = 'Ingresa un límite válido';
        if (form.cut_off_day < 1 || form.cut_off_day > 31) newErrors.cut_off_day = 'Día 1-31';
        if (form.payment_due_day < 1 || form.payment_due_day > 31) newErrors.payment_due_day = 'Día 1-31';

        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        try {
            if (isEditing && editCard) {
                await updateCard.mutateAsync({ id: editCard.id, ...form });
            } else {
                await createCard.mutateAsync(form);
            }
            resetForm();
            onClose();
        } catch (err: any) {
            const msg = err?.message ?? 'No se pudo guardar la tarjeta';
            Alert.alert('Error al guardar', msg);
        }
    };

    const isLoading = createCard.isPending || updateCard.isPending;

    /**
     * Altura máxima del modal:
     * - En web usamos un porcentaje del viewport real
     * - En móvil dejamos el 90% estándar
     */
    const modalMaxHeight = Platform.OS === 'web'
        ? Math.min(windowHeight * 0.85, 700)
        : '90%';

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <Pressable style={styles.overlayTouchable} onPress={onClose} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.keyboardView}
                >
                    <View style={[
                        styles.container,
                        { backgroundColor: C.background.secondary, maxHeight: modalMaxHeight },
                        // En web: centrar horizontalmente con ancho máximo
                        Platform.OS === 'web' && styles.containerWeb,
                    ]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: C.text.primary }]}>
                                {isEditing ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
                            </Text>
                            <Pressable onPress={onClose} hitSlop={12}>
                                <Text style={[styles.closeBtn, { color: C.text.tertiary }]}>✕</Text>
                            </Pressable>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={styles.scrollContent}
                        >
                            {errors.general && (
                                <View style={[styles.errorBanner, { backgroundColor: `${C.accent.danger}18` }]}>
                                    <Text style={[styles.errorText, { color: C.accent.danger }]}>
                                        {errors.general}
                                    </Text>
                                </View>
                            )}

                            {/* Selector de banco */}
                            <Text style={[styles.label, { color: C.text.secondary }]}>Banco</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankRow}>
                                {Object.entries(BANK_COLORS).map(([bank, color]) => (
                                    <Pressable
                                        key={bank}
                                        style={[
                                            styles.bankChip,
                                            { borderColor: color },
                                            form.bank_name === bank && { backgroundColor: color },
                                        ]}
                                        onPress={() => {
                                            updateField('bank_name', bank);
                                            updateField('card_color', color);
                                        }}
                                    >
                                        <Text style={[
                                            styles.bankChipText,
                                            { color: C.text.secondary },
                                            form.bank_name === bank && { color: '#FFFFFF', fontFamily: TYPOGRAPHY.family.bold },
                                        ]}>
                                            {bank}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                            {errors.bank_name && (
                                <Text style={[styles.fieldError, { color: C.accent.danger }]}>
                                    {errors.bank_name}
                                </Text>
                            )}

                            <Input
                                label="Alias (opcional)"
                                placeholder="Ej: Personal, Viajes..."
                                value={form.card_alias}
                                onChangeText={(v) => updateField('card_alias', v)}
                            />
                            <Input
                                label="Últimos 4 dígitos"
                                placeholder="1234"
                                value={form.last_four_digits}
                                onChangeText={(v) => updateField('last_four_digits', v)}
                                error={errors.last_four_digits}
                                keyboardType="number-pad"
                                maxLength={4}
                            />
                            <Input
                                label="Límite de crédito"
                                placeholder="50000"
                                value={form.credit_limit > 0 ? String(form.credit_limit) : ''}
                                onChangeText={(v) => updateField('credit_limit', parseFloat(v) || 0)}
                                error={errors.credit_limit}
                                keyboardType="decimal-pad"
                                leftIcon={<Text style={[styles.inputIcon, { color: C.text.secondary }]}>$</Text>}
                            />
                            <Input
                                label="Saldo actual"
                                placeholder="0"
                                value={form.current_balance > 0 ? String(form.current_balance) : ''}
                                onChangeText={(v) => updateField('current_balance', parseFloat(v) || 0)}
                                keyboardType="decimal-pad"
                                leftIcon={<Text style={[styles.inputIcon, { color: C.text.secondary }]}>$</Text>}
                            />

                            {/* Fechas de corte y pago */}
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Input
                                        label="Día de corte"
                                        placeholder="15"
                                        value={String(form.cut_off_day)}
                                        onChangeText={(v) => updateField('cut_off_day', parseInt(v) || 1)}
                                        error={errors.cut_off_day}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Input
                                        label="Día de pago"
                                        placeholder="5"
                                        value={String(form.payment_due_day)}
                                        onChangeText={(v) => updateField('payment_due_day', parseInt(v) || 1)}
                                        error={errors.payment_due_day}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                    />
                                </View>
                            </View>

                            {/* ── Pagos del estado de cuenta ── */}
                            <Text style={[styles.sectionLabel, { color: C.text.primary }]}>
                                Pagos (Estado de Cuenta)
                            </Text>
                            <Text style={[styles.sectionHint, { color: C.text.tertiary }]}>
                                Estos datos los encuentras en tu estado de cuenta mensual
                            </Text>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Input
                                        label="Pago Mínimo"
                                        placeholder="0"
                                        value={(form.minimum_payment ?? 0) > 0 ? String(form.minimum_payment) : ''}
                                        onChangeText={(v) => updateField('minimum_payment', parseFloat(v) || 0)}
                                        keyboardType="decimal-pad"
                                        leftIcon={<Text style={[styles.inputIcon, { color: C.text.secondary }]}>$</Text>}
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Input
                                        label="Pago sin Intereses"
                                        placeholder="0"
                                        value={(form.no_interest_payment ?? 0) > 0 ? String(form.no_interest_payment) : ''}
                                        onChangeText={(v) => updateField('no_interest_payment', parseFloat(v) || 0)}
                                        keyboardType="decimal-pad"
                                        leftIcon={<Text style={[styles.inputIcon, { color: C.text.secondary }]}>$</Text>}
                                    />
                                </View>
                            </View>

                            <Button
                                title={isEditing ? 'Guardar Cambios' : 'Agregar Tarjeta'}
                                onPress={handleSave}
                                loading={isLoading}
                                disabled={isLoading}
                                fullWidth
                                size="lg"
                                style={styles.saveButton}
                            />
                        </ScrollView>
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
        justifyContent: 'flex-end',
    },
    /** Zona tocable para cerrar al hacer tap fuera */
    overlayTouchable: {
        flex: 1,
    },
    keyboardView: {
        // No usar flex:1 aquí — permite que el container crezca solo lo que necesite
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: RADIUS['2xl'],
        borderTopRightRadius: RADIUS['2xl'],
        paddingTop: SPACING.xl,
        paddingHorizontal: SPACING.xl,
        // En móvil el maxHeight se aplica inline
    },
    /** En web: centrar y limitar ancho para que no se estire en desktop */
    containerWeb: {
        alignSelf: 'center' as any,
        width: '100%',
        maxWidth: 500,
        borderBottomLeftRadius: RADIUS['2xl'],
        borderBottomRightRadius: RADIUS['2xl'],
    },
    scrollContent: {
        paddingBottom: SPACING['3xl'],
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: SPACING.xl,
    },
    title: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xl },
    closeBtn: { fontSize: 22, padding: SPACING.sm },
    label: {
        fontFamily: TYPOGRAPHY.family.medium,
        fontSize: TYPOGRAPHY.size.sm,
        marginBottom: SPACING.sm,
    },
    sectionLabel: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.md,
        marginTop: SPACING.sm,
        marginBottom: SPACING.xs,
    },
    sectionHint: {
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.xs,
        marginBottom: SPACING.md,
    },
    bankRow: { marginBottom: SPACING.md, flexGrow: 0 },
    bankChip: {
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full, borderWidth: 1.5, marginRight: SPACING.sm,
    },
    bankChipText: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm },
    fieldError: {
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.xs,
        marginTop: -SPACING.sm,
        marginBottom: SPACING.md,
    },
    inputIcon: { fontFamily: TYPOGRAPHY.family.semibold, fontSize: 16 },
    row: { flexDirection: 'row', gap: SPACING.md },
    halfInput: { flex: 1 },
    errorBanner: { borderRadius: RADIUS.sm, padding: SPACING.md, marginBottom: SPACING.lg },
    errorText: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm, textAlign: 'center' },
    saveButton: { marginTop: SPACING.lg, marginBottom: SPACING.xl },
});
