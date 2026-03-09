/**
 * Cards Screen - Lista y gestión de tarjetas de crédito
 * CRUD completo con carrusel visual, indicadores de estado y FAB
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, Badge, ProgressBar, Button } from '../../src/components/ui';
import { AddCardModal } from '../../src/components/cards/AddCardModal';
import { PayCardModal } from '../../src/components/cards/PayCardModal';
import { useRouter } from 'expo-router';
import { useCards, useDeleteCard, getDaysUntil, getCardStatus } from '../../src/hooks/useCards';
import { formatCurrency, formatCardNumber } from '../../src/utils/formatters';
import { useThemeStore } from '../../src/store/themeStore';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import type { CreditCard } from '../../src/types/database';

export default function CardsScreen() {
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);
    const router = useRouter();
    const { data: cards = [], isLoading, refetch, isRefetching } = useCards();
    const deleteCard = useDeleteCard();
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
    const [payingCard, setPayingCard] = useState<CreditCard | null>(null);

    const handleEdit = (card: CreditCard) => {
        setEditingCard(card);
        setModalVisible(true);
    };

    const handleDelete = (card: CreditCard) => {
        Alert.alert(
            'Eliminar Tarjeta',
            `¿Eliminar ${card.bank_name} •••• ${card.last_four_digits}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => deleteCard.mutate(card.id),
                },
            ]
        );
    };

    const handleAdd = () => {
        setEditingCard(null);
        setModalVisible(true);
    };

    return (
        <View style={[styles.screen, { backgroundColor: C.background.primary }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: C.text.primary }]}>Mis Tarjetas</Text>
                <Pressable onPress={handleAdd} style={[styles.addBtn, { backgroundColor: C.accent.primary }]}>
                    <Ionicons name="add" size={18} color="#FFF" />
                    <Text style={styles.addBtnText}>Agregar</Text>
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
                {/* Estado vacío */}
                {!isLoading && cards.length === 0 && (
                    <GlassCard variant="elevated" padding="2xl" style={styles.emptyCard}>
                        <Ionicons name="card-outline" size={56} color={C.text.tertiary} style={{ marginBottom: SPACING.md }} />
                        <Text style={[styles.emptyTitle, { color: C.text.primary }]}>Sin tarjetas</Text>
                        <Text style={[styles.emptyText, { color: C.text.tertiary }]}>
                            Agrega tu primera tarjeta para comenzar a trackear tus gastos.
                        </Text>
                        <Button title="Agregar Tarjeta" onPress={handleAdd} size="md" style={styles.emptyBtn} />
                    </GlassCard>
                )}

                {/* Lista de tarjetas */}
                {cards.map((card, index) => (
                    <CardItem
                        key={card.id}
                        card={card}
                        index={index}
                        isDark={isDark}
                        onEdit={() => handleEdit(card)}
                        onDelete={() => handleDelete(card)}
                        onPay={() => setPayingCard(card)}
                        onDetail={() => router.push(`/card-detail/${card.id}` as any)}
                    />
                ))}

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Modal de agregar/editar */}
            <AddCardModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                editCard={editingCard}
            />

            {/* Modal de pago */}
            {payingCard && (
                <PayCardModal
                    visible={!!payingCard}
                    onClose={() => setPayingCard(null)}
                    card={payingCard}
                />
            )}
        </View>
    );
}

// ── CardItem: tarjeta individual con info completa ──

interface CardItemProps {
    card: CreditCard;
    index: number;
    isDark: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onPay: () => void;
    onDetail: () => void;
}

function CardItem({ card, index, isDark, onEdit, onDelete, onPay, onDetail }: CardItemProps) {
    const C = getThemeColors(isDark);
    const status = getCardStatus(card);
    const daysToPayment = getDaysUntil(card.payment_due_day);
    const daysToCutoff = getDaysUntil(card.cut_off_day);
    const usagePercent = card.credit_limit > 0
        ? (card.current_balance / card.credit_limit) * 100
        : 0;
    const available = card.credit_limit - card.current_balance;

    const statusConfig = {
        safe: { text: 'Al día', iconName: 'checkmark-circle' as const, iconColor: C.accent.success },
        warning: { text: 'Precaución', iconName: 'alert-circle' as const, iconColor: C.accent.warning },
        danger: { text: 'Urgente', iconName: 'warning' as const, iconColor: C.accent.danger },
    };

    return (
        <Animated.View entering={FadeInDown.duration(400).delay(index * 100)}>
            <GlassCard
                variant="elevated"
                padding="lg"
                pressable
                onPress={onDetail}
                style={StyleSheet.flatten([
                    styles.cardItem,
                    { borderLeftColor: card.card_color ?? C.accent.primary, borderLeftWidth: 4 },
                ])}
            >
                {/* Header de tarjeta */}
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={[styles.cardBank, { color: C.text.primary }]}>{card.bank_name}</Text>
                        <Text style={[styles.cardNumber, { color: C.text.tertiary }]}>
                            {formatCardNumber(card.last_four_digits)}
                        </Text>
                        {card.card_alias && (
                            <Text style={[styles.cardAlias, { color: C.accent.primary }]}>{card.card_alias}</Text>
                        )}
                    </View>
                    <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
                        backgroundColor: `${statusConfig[status].iconColor}18`,
                    }}>
                        <Ionicons name={statusConfig[status].iconName} size={14} color={statusConfig[status].iconColor} />
                        <Text style={{
                            fontFamily: TYPOGRAPHY.family.semibold,
                            fontSize: TYPOGRAPHY.size.xs,
                            color: statusConfig[status].iconColor,
                        }}>
                            {statusConfig[status].text}
                        </Text>
                    </View>
                </View>

                {/* Saldo y límite */}
                <View style={styles.balanceRow}>
                    <View>
                        <Text style={[styles.balanceLabel, { color: C.text.tertiary }]}>Saldo</Text>
                        <Text style={[styles.balanceAmount, { color: C.text.primary }]}>
                            {formatCurrency(card.current_balance)}
                        </Text>
                    </View>
                    <View style={styles.availableCol}>
                        <Text style={[styles.balanceLabel, { color: C.text.tertiary }]}>Disponible</Text>
                        <Text style={[styles.balanceAmount, { color: C.accent.success }]}>
                            {formatCurrency(available)}
                        </Text>
                    </View>
                </View>

                {/* Barra de uso */}
                <ProgressBar
                    progress={usagePercent}
                    label="Uso del crédito"
                    showPercentage
                    height={6}
                />

                {/* Fechas */}
                <View style={[styles.datesRow, { borderTopColor: C.border.secondary }]}>
                    <View style={styles.dateItem}>
                        <Text style={[styles.dateLabel, { color: C.text.tertiary }]}>Corte</Text>
                        <Text style={[styles.dateValue, { color: C.text.secondary }]}>
                            Día {card.cut_off_day} · {daysToCutoff > 0 ? `en ${daysToCutoff}d` : 'Hoy'}
                        </Text>
                    </View>
                    <View style={styles.dateItem}>
                        <Text style={[styles.dateLabel, { color: C.text.tertiary }]}>Pago</Text>
                        <Text style={[
                            styles.dateValue,
                            { color: C.text.secondary },
                            daysToPayment <= 3 && { color: C.accent.danger },
                        ]}>
                            Día {card.payment_due_day} · {daysToPayment > 0 ? `en ${daysToPayment}d` : 'Hoy'}
                        </Text>
                    </View>
                </View>

                {/* Acciones */}
                <View style={[styles.actions, { borderTopColor: C.border.secondary }]}>
                    <Pressable style={[styles.actionBtn, { flexDirection: 'row', alignItems: 'center', gap: 6 }]} onPress={onPay}>
                        <Ionicons name="wallet-outline" size={16} color={C.accent.primary} />
                        <Text style={[styles.actionText, { color: C.accent.primary }]}>Pagar</Text>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, { flexDirection: 'row', alignItems: 'center', gap: 6 }]} onPress={onEdit}>
                        <Ionicons name="create-outline" size={16} color={C.text.secondary} />
                        <Text style={[styles.actionText, { color: C.text.secondary }]}>Editar</Text>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, { flexDirection: 'row', alignItems: 'center', gap: 6 }]} onPress={onDelete}>
                        <Ionicons name="trash-outline" size={16} color={C.accent.danger} />
                        <Text style={[styles.actionText, { color: C.accent.danger }]}>Eliminar</Text>
                    </Pressable>
                </View>
            </GlassCard>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SPACING['5xl'],
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.lg,
    },
    title: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.xl,
        letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    },
    addBtn: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        ...SHADOWS.floating,
    },
    addBtnText: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.xs,
        color: '#FFFFFF',
        letterSpacing: TYPOGRAPHY.letterSpacing.widest,
        textTransform: 'uppercase',
    },
    // Empty state
    emptyCard: { alignItems: 'center', marginTop: SPACING['4xl'] },
    emptyTitle: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.xl,
    },
    emptyText: {
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.md,
        textAlign: 'center',
        marginTop: SPACING.xs,
        marginBottom: SPACING.lg,
    },
    emptyBtn: { marginTop: SPACING.sm },
    // Card item
    cardItem: { marginBottom: SPACING.lg },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.lg,
    },
    cardBank: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.xl,
        letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    },
    cardNumber: {
        fontFamily: TYPOGRAPHY.family.medium,
        fontSize: TYPOGRAPHY.size.sm,
        marginTop: 4,
        letterSpacing: 2,
    },
    cardAlias: {
        fontFamily: TYPOGRAPHY.family.medium,
        fontSize: TYPOGRAPHY.size.xs,
        marginTop: 2,
    },
    // Balance
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.lg,
    },
    availableCol: { alignItems: 'flex-end' },
    balanceLabel: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.xs,
        letterSpacing: TYPOGRAPHY.letterSpacing.widest,
        textTransform: 'uppercase',
    },
    balanceAmount: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size['2xl'],
        letterSpacing: TYPOGRAPHY.letterSpacing.tighter,
        marginTop: 4,
    },
    // Dates
    datesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.md,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
    },
    dateItem: {},
    dateLabel: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.xs,
        letterSpacing: TYPOGRAPHY.letterSpacing.widest,
        textTransform: 'uppercase',
    },
    dateValue: {
        fontFamily: TYPOGRAPHY.family.semibold,
        fontSize: TYPOGRAPHY.size.md,
        marginTop: 4,
    },
    // Actions
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: SPACING.lg,
        marginTop: SPACING.md,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
    },
    actionBtn: { padding: SPACING.xs },
    actionText: {
        fontFamily: TYPOGRAPHY.family.medium,
        fontSize: TYPOGRAPHY.size.sm,
    },
    bottomSpacer: { height: 20 },
});
