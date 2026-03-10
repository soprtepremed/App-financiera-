/**
 * AddCardModal - Modal para agregar/editar tarjeta de crédito
 * Formulario completo con validación, pago mínimo/sin intereses,
 * y UI responsiva que funciona correctamente en web y móvil.
 *
 * Los campos numéricos se manejan como texto puro para evitar
 * problemas con comas/puntos al escribir. Solo se parsean al guardar.
 */
import React, { useState, useEffect, useRef } from 'react';
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
import { parseAmount } from '../../utils/formatters';
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

/**
 * Estado de texto para campos numéricos.
 * Se mantiene como string puro mientras el usuario escribe,
 * y solo se parsea a número al momento de guardar.
 */
interface NumericFields {
    credit_limit: string;
    current_balance: string;
    cut_off_day: string;
    payment_due_day: string;
    minimum_payment: string;
    no_interest_payment: string;
}

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

    // ── Estado del formulario (texto) ──
    const [bankName, setBankName] = useState('');
    const [cardAlias, setCardAlias] = useState('');
    const [lastFour, setLastFour] = useState('');
    const [cardColor, setCardColor] = useState('#6C63FF');

    // Campos numéricos como TEXTO puro
    const [nums, setNums] = useState<NumericFields>({
        credit_limit: '',
        current_balance: '',
        cut_off_day: '1',
        payment_due_day: '20',
        minimum_payment: '',
        no_interest_payment: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Pre-llenar si es edición
    useEffect(() => {
        if (editCard) {
            setBankName(editCard.bank_name);
            setCardAlias(editCard.card_alias ?? '');
            setLastFour(editCard.last_four_digits);
            setCardColor(editCard.card_color ?? '#6C63FF');
            setNums({
                credit_limit: editCard.credit_limit > 0 ? String(editCard.credit_limit) : '',
                current_balance: editCard.current_balance > 0 ? String(editCard.current_balance) : '',
                cut_off_day: String(editCard.cut_off_day),
                payment_due_day: String(editCard.payment_due_day),
                minimum_payment: (editCard as any).minimum_payment > 0 ? String((editCard as any).minimum_payment) : '',
                no_interest_payment: (editCard as any).no_interest_payment > 0 ? String((editCard as any).no_interest_payment) : '',
            });
        } else {
            resetForm();
        }
    }, [editCard, visible]);

    const resetForm = () => {
        setBankName(''); setCardAlias(''); setLastFour('');
        setCardColor('#6C63FF');
        setNums({
            credit_limit: '', current_balance: '',
            cut_off_day: '1', payment_due_day: '20',
            minimum_payment: '', no_interest_payment: '',
        });
        setErrors({});
    };

    const updateNum = (field: keyof NumericFields, value: string) => {
        // Solo permitir dígitos, puntos y comas
        const clean = value.replace(/[^0-9.,]/g, '');
        setNums(prev => ({ ...prev, [field]: clean }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    // Guard contra doble-click
    const savingRef = useRef(false);

    const handleSave = async () => {
        if (savingRef.current) return; // ya se está guardando
        const newErrors: Record<string, string> = {};

        // Validar texto
        const bankVal = validateRequired(bankName, 'El banco');
        if (!bankVal.isValid) newErrors.bank_name = bankVal.error!;
        const digitsVal = validateLastFourDigits(lastFour);
        if (!digitsVal.isValid) newErrors.last_four_digits = digitsVal.error!;

        // Parsear numéricos al guardar
        const creditLimit = parseAmount(nums.credit_limit);
        const currentBalance = parseAmount(nums.current_balance);
        const cutOff = parseInt(nums.cut_off_day) || 0;
        const paymentDay = parseInt(nums.payment_due_day) || 0;
        const minPayment = parseAmount(nums.minimum_payment);
        const noInterest = parseAmount(nums.no_interest_payment);

        if (creditLimit <= 0) newErrors.credit_limit = 'Ingresa un límite válido';
        if (cutOff < 1 || cutOff > 31) newErrors.cut_off_day = 'Día 1-31';
        if (paymentDay < 1 || paymentDay > 31) newErrors.payment_due_day = 'Día 1-31';

        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        const formData: CardFormData = {
            bank_name: bankName,
            card_alias: cardAlias,
            last_four_digits: lastFour,
            credit_limit: creditLimit,
            current_balance: currentBalance,
            cut_off_day: cutOff,
            payment_due_day: paymentDay,
            minimum_payment: minPayment,
            no_interest_payment: noInterest,
            card_color: cardColor,
        };

        savingRef.current = true;
        try {
            if (isEditing && editCard) {
                await updateCard.mutateAsync({ id: editCard.id, ...formData });
            } else {
                await createCard.mutateAsync(formData);
            }
            resetForm();
            onClose();
        } catch (err: any) {
            const msg = err?.message ?? 'No se pudo guardar la tarjeta';
            Alert.alert('Error al guardar', msg);
        } finally {
            savingRef.current = false;
        }
    };

    const isLoading = createCard.isPending || updateCard.isPending;
    const modalMaxHeight = Platform.OS === 'web'
        ? Math.min(windowHeight * 0.85, 700) : '90%';

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
                                            bankName === bank && { backgroundColor: color },
                                        ]}
                                        onPress={() => {
                                            setBankName(bank);
                                            setCardColor(color);
                                            if (errors.bank_name) setErrors(p => ({ ...p, bank_name: '' }));
                                        }}
                                    >
                                        <Text style={[
                                            styles.bankChipText,
                                            { color: C.text.secondary },
                                            bankName === bank && { color: '#FFFFFF', fontFamily: TYPOGRAPHY.family.bold },
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
                                value={cardAlias}
                                onChangeText={setCardAlias}
                            />
                            <Input
                                label="Últimos 4 dígitos"
                                placeholder="1234"
                                value={lastFour}
                                onChangeText={setLastFour}
                                error={errors.last_four_digits}
                                keyboardType="number-pad"
                                maxLength={4}
                            />
                            <Input
                                label="Límite de crédito"
                                placeholder="50000"
                                value={nums.credit_limit}
                                onChangeText={(v) => updateNum('credit_limit', v)}
                                error={errors.credit_limit}
                                keyboardType="decimal-pad"
                                leftIcon={<Text style={[styles.inputIcon, { color: C.text.secondary }]}>$</Text>}
                            />
                            <Text style={[styles.fieldHint, { color: C.text.tertiary }]}>
                                El monto máximo que el banco te permite gastar con esta tarjeta.
                            </Text>
                            <Input
                                label="Saldo actual (lo que debes)"
                                placeholder="0"
                                value={nums.current_balance}
                                onChangeText={(v) => updateNum('current_balance', v)}
                                keyboardType="decimal-pad"
                                leftIcon={<Text style={[styles.inputIcon, { color: C.text.secondary }]}>$</Text>}
                            />
                            <Text style={[styles.fieldHint, { color: C.text.tertiary }]}>
                                Tu deuda actual: la cantidad total que debes pagar al banco este mes.
                            </Text>

                            {/* Fechas de corte y pago */}
                            <Text style={[styles.fieldHint, { color: C.text.tertiary, marginBottom: SPACING.sm }]}>
                                📅 Corte: día en que el banco calcula tu deuda. Pago: fecha límite para pagar.
                            </Text>
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Input
                                        label="Día de corte"
                                        placeholder="15"
                                        value={nums.cut_off_day}
                                        onChangeText={(v) => updateNum('cut_off_day', v)}
                                        error={errors.cut_off_day}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Input
                                        label="Día de pago"
                                        placeholder="5"
                                        value={nums.payment_due_day}
                                        onChangeText={(v) => updateNum('payment_due_day', v)}
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
                                Estos datos los encuentras en tu estado de cuenta mensual. ¡Revisa tu app bancaria!
                            </Text>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Input
                                        label="Pago Mínimo"
                                        placeholder="0"
                                        value={nums.minimum_payment}
                                        onChangeText={(v) => updateNum('minimum_payment', v)}
                                        keyboardType="decimal-pad"
                                        leftIcon={<Text style={[styles.inputIcon, { color: C.text.secondary }]}>$</Text>}
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Input
                                        label="Pago sin Intereses"
                                        placeholder="0"
                                        value={nums.no_interest_payment}
                                        onChangeText={(v) => updateNum('no_interest_payment', v)}
                                        keyboardType="decimal-pad"
                                        leftIcon={<Text style={[styles.inputIcon, { color: C.text.secondary }]}>$</Text>}
                                    />
                                </View>
                            </View>
                            <Text style={[styles.fieldHint, { color: C.text.tertiary }]}>
                                Mínimo: lo mínimo para no caer en mora.{"\n"}Sin intereses: págalo para no generar intereses ordinarios.
                            </Text>

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
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    overlayTouchable: { flex: 1 },
    keyboardView: { justifyContent: 'flex-end' },
    container: {
        borderTopLeftRadius: RADIUS['2xl'],
        borderTopRightRadius: RADIUS['2xl'],
        paddingTop: SPACING.xl,
        paddingHorizontal: SPACING.xl,
    },
    containerWeb: {
        alignSelf: 'center' as any,
        width: '100%', maxWidth: 500,
        borderBottomLeftRadius: RADIUS['2xl'],
        borderBottomRightRadius: RADIUS['2xl'],
    },
    scrollContent: { paddingBottom: SPACING['3xl'] },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: SPACING.xl,
    },
    title: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xl },
    closeBtn: { fontSize: 22, padding: SPACING.sm },
    label: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm, marginBottom: SPACING.sm },
    sectionLabel: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md, marginTop: SPACING.sm, marginBottom: SPACING.xs },
    sectionHint: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs, marginBottom: SPACING.md },
    bankRow: { marginBottom: SPACING.md, flexGrow: 0 },
    bankChip: {
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full, borderWidth: 1.5, marginRight: SPACING.sm,
    },
    bankChipText: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm },
    fieldError: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs, marginTop: -SPACING.sm, marginBottom: SPACING.md },
    inputIcon: { fontFamily: TYPOGRAPHY.family.semibold, fontSize: 16 },
    fieldHint: {
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.xs - 1,
        marginTop: -SPACING.xs,
        marginBottom: SPACING.md,
        lineHeight: 16,
    },
    row: { flexDirection: 'row', gap: SPACING.md },
    halfInput: { flex: 1 },
    errorBanner: { borderRadius: RADIUS.sm, padding: SPACING.md, marginBottom: SPACING.lg },
    errorText: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm, textAlign: 'center' },
    saveButton: { marginTop: SPACING.lg, marginBottom: SPACING.xl },
});
