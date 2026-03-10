/**
 * AddDebitAccountModal - Modal para agregar/editar cuenta de débito o ahorro
 * Formulario responsivo para web y móvil.
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
import { Button, Input } from '../ui';
import {
    useCreateDebitAccount,
    useUpdateDebitAccount,
    type DebitAccount,
    type DebitAccountFormData,
} from '../../hooks/useDebitAccounts';
import { useThemeStore } from '../../store/themeStore';
import { parseAmount } from '../../utils/formatters';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

// ── Colores de bancos ──
const BANK_COLORS: Record<string, string> = {
    'BBVA': '#004481',
    'Banorte': '#EB0029',
    'Santander': '#EC0000',
    'HSBC': '#DB0011',
    'Citibanamex': '#056DAE',
    'Scotiabank': '#EC111A',
    'Nu': '#820AD1',
    'Hey Banco': '#00C389',
    'Mercado Pago': '#009CDE',
    'Spin': '#2D2D7F',
    'Otro': '#10B981',
};

// ── Tipos de cuenta ──
const ACCOUNT_TYPES: { key: DebitAccountFormData['account_type']; label: string; icon: string }[] = [
    { key: 'debit', label: 'Débito', icon: '💳' },
    { key: 'savings', label: 'Ahorro', icon: '🏦' },
    { key: 'investment', label: 'Inversión', icon: '📈' },
];

interface Props {
    visible: boolean;
    onClose: () => void;
    editAccount?: DebitAccount | null;
}

export function AddDebitAccountModal({ visible, onClose, editAccount }: Props) {
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);
    const { height: windowHeight } = useWindowDimensions();
    const createAccount = useCreateDebitAccount();
    const updateAccount = useUpdateDebitAccount();
    const isEditing = !!editAccount;

    const [form, setForm] = useState<DebitAccountFormData>({
        bank_name: '',
        account_alias: '',
        last_four_digits: '',
        account_type: 'debit',
        current_balance: 0,
        account_color: '#10B981',
    });
    // Saldo como texto para evitar problemas con comas/puntos
    const [balanceText, setBalanceText] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (editAccount) {
            setForm({
                bank_name: editAccount.bank_name,
                account_alias: editAccount.account_alias ?? '',
                last_four_digits: editAccount.last_four_digits,
                account_type: editAccount.account_type,
                current_balance: editAccount.current_balance,
                account_color: editAccount.account_color ?? '#10B981',
            });
            setBalanceText(editAccount.current_balance > 0 ? String(editAccount.current_balance) : '');
        } else {
            resetForm();
        }
    }, [editAccount, visible]);

    const resetForm = () => {
        setForm({
            bank_name: '', account_alias: '', last_four_digits: '',
            account_type: 'debit', current_balance: 0, account_color: '#10B981',
        });
        setBalanceText('');
        setErrors({});
    };

    const updateField = (field: keyof DebitAccountFormData, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    // Guard contra doble-click
    const savingRef = useRef(false);

    const handleSave = async () => {
        if (savingRef.current) return;
        const newErrors: Record<string, string> = {};
        if (!form.bank_name.trim()) newErrors.bank_name = 'Selecciona un banco';
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        // Parsear saldo desde texto
        const parsedBalance = parseAmount(balanceText);

        savingRef.current = true;
        try {
            const dataToSave = { ...form, current_balance: parsedBalance };
            if (isEditing && editAccount) {
                await updateAccount.mutateAsync({ id: editAccount.id, ...dataToSave });
            } else {
                await createAccount.mutateAsync(dataToSave);
            }
            resetForm();
            onClose();
        } catch (err: any) {
            const msg = err?.message ?? 'No se pudo guardar la cuenta';
            Alert.alert('Error al guardar', msg);
        } finally {
            savingRef.current = false;
        }
    };

    const isLoading = createAccount.isPending || updateAccount.isPending;
    const modalMaxHeight = Platform.OS === 'web'
        ? Math.min(windowHeight * 0.85, 680)
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
                        Platform.OS === 'web' && styles.containerWeb,
                    ]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: C.text.primary }]}>
                                {isEditing ? 'Editar Cuenta' : 'Nueva Cuenta'}
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
                            {/* Tipo de cuenta */}
                            <Text style={[styles.label, { color: C.text.secondary }]}>Tipo de cuenta</Text>
                            <View style={styles.typeRow}>
                                {ACCOUNT_TYPES.map(t => (
                                    <Pressable
                                        key={t.key}
                                        style={[
                                            styles.typeChip,
                                            { backgroundColor: C.background.tertiary, borderColor: C.border.primary },
                                            form.account_type === t.key && {
                                                borderColor: C.accent.primary,
                                                backgroundColor: `${C.accent.primary}15`,
                                            },
                                        ]}
                                        onPress={() => updateField('account_type', t.key)}
                                    >
                                        <Text style={styles.typeIcon}>{t.icon}</Text>
                                        <Text style={[
                                            styles.typeLabel,
                                            { color: C.text.secondary },
                                            form.account_type === t.key && {
                                                color: C.accent.primary,
                                                fontFamily: TYPOGRAPHY.family.bold,
                                            },
                                        ]}>{t.label}</Text>
                                    </Pressable>
                                ))}
                            </View>
                            <Text style={[styles.fieldHint, { color: C.text.tertiary }]}>
                                Débito: cuenta para gastos diarios. Ahorro: dinero guardado. Inversión: fondos en plataformas.
                            </Text>

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
                                            updateField('account_color', color);
                                        }}
                                    >
                                        <Text style={[
                                            styles.bankChipText,
                                            { color: C.text.secondary },
                                            form.bank_name === bank && { color: '#FFF', fontFamily: TYPOGRAPHY.family.bold },
                                        ]}>{bank}</Text>
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
                                placeholder="Ej: Nómina, Ahorro viaje..."
                                value={form.account_alias}
                                onChangeText={(v) => updateField('account_alias', v)}
                            />
                            <Input
                                label="Últimos 4 dígitos (opcional)"
                                placeholder="5678"
                                value={form.last_four_digits}
                                onChangeText={(v) => updateField('last_four_digits', v)}
                                keyboardType="number-pad"
                                maxLength={4}
                            />
                            <Input
                                label="Saldo actual"
                                placeholder="0"
                                value={balanceText}
                                onChangeText={(v) => setBalanceText(v.replace(/[^0-9.,]/g, ''))}
                                keyboardType="decimal-pad"
                                leftIcon={<Text style={[styles.inputIcon, { color: C.text.secondary }]}>$</Text>}
                            />
                            <Text style={[styles.fieldHint, { color: C.text.tertiary }]}>
                                El dinero que tienes disponible ahora en esta cuenta. Consúltalo en tu app bancaria.
                            </Text>

                            <Button
                                title={isEditing ? 'Guardar Cambios' : 'Agregar Cuenta'}
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
        width: '100%',
        maxWidth: 500,
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
    label: {
        fontFamily: TYPOGRAPHY.family.medium,
        fontSize: TYPOGRAPHY.size.sm,
        marginBottom: SPACING.sm,
    },
    typeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
    typeChip: {
        flex: 1, alignItems: 'center', paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg, borderWidth: 1.5, gap: 4,
    },
    typeIcon: { fontSize: 24 },
    typeLabel: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.xs },
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
    fieldHint: {
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.xs - 1,
        marginTop: -SPACING.xs,
        marginBottom: SPACING.md,
        lineHeight: 16,
    },
    saveButton: { marginTop: SPACING.lg, marginBottom: SPACING.xl },
});
