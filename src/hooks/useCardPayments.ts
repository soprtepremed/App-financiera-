/**
 * useCardPayments - React Query hooks para pagos de tarjeta
 * CRUD de pagos + actualización automática de balance
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import type { CardPayment } from '../types/database';

// ── Tipos ──

export interface PaymentFormData {
    /** ID de la tarjeta a la que se registra el pago */
    card_id: string;
    /** Monto pagado */
    amount_paid: number;
    /** Tipo de pago */
    payment_type: 'minimum' | 'no_interest' | 'full' | 'custom';
    /** Fecha del pago (ISO string YYYY-MM-DD) */
    payment_date?: string;
    /** Notas opcionales */
    notes?: string;
}

// ── Keys ──

const PAYMENTS_KEY = ['card_payments'] as const;
const paymentsByCardKey = (cardId: string) => ['card_payments', cardId] as const;

// ── Queries ──

/**
 * Obtiene los pagos recientes de una tarjeta específica.
 * Ordenados por fecha descendente, limitado a los últimos 20.
 */
export function useCardPayments(cardId: string) {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: paymentsByCardKey(cardId),
        queryFn: async (): Promise<CardPayment[]> => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('card_payments')
                .select('*')
                .eq('card_id', cardId)
                .eq('user_id', user.id)
                .order('payment_date', { ascending: false })
                .limit(20);

            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user && !!cardId,
        staleTime: 1000 * 60 * 5,
    });
}

// ── Mutations ──

/**
 * Registrar un pago a una tarjeta de crédito.
 * Además de insertar el pago, actualiza el current_balance de la tarjeta
 * restando el monto pagado (mínimo 0).
 */
export function useCreatePayment() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (formData: PaymentFormData) => {
            if (!user) throw new Error('No autenticado');

            const paymentDate = formData.payment_date
                ?? new Date().toISOString().split('T')[0];

            // 1. Insertar el registro del pago
            const { data: payment, error: payError } = await supabase
                .from('card_payments')
                .insert({
                    card_id: formData.card_id,
                    user_id: user.id,
                    amount_paid: formData.amount_paid,
                    payment_type: formData.payment_type,
                    payment_date: paymentDate,
                    notes: formData.notes ?? null,
                })
                .select()
                .single();

            if (payError) throw payError;

            // 2. Obtener balance actual de la tarjeta
            const { data: card, error: cardErr } = await supabase
                .from('credit_cards')
                .select('current_balance')
                .eq('id', formData.card_id)
                .single();

            if (cardErr) throw cardErr;

            // 3. Actualizar el balance (nunca menor a 0)
            const newBalance = Math.max(
                0,
                (card?.current_balance ?? 0) - formData.amount_paid
            );

            const { error: updateErr } = await supabase
                .from('credit_cards')
                .update({ current_balance: newBalance })
                .eq('id', formData.card_id)
                .eq('user_id', user.id);

            if (updateErr) throw updateErr;

            return payment;
        },
        onSuccess: (_data, variables) => {
            // Invalida pagos de esta tarjeta y la lista de tarjetas
            queryClient.invalidateQueries({ queryKey: paymentsByCardKey(variables.card_id) });
            queryClient.invalidateQueries({ queryKey: PAYMENTS_KEY });
            queryClient.invalidateQueries({ queryKey: ['cards'] });
            queryClient.invalidateQueries({ queryKey: ['budget'] });
        },
    });
}

/**
 * Helpers para calcular montos de pago rápido.
 */
export function getPaymentAmounts(card: {
    current_balance: number;
    minimum_payment: number;
    no_interest_payment: number;
}) {
    return {
        minimum: card.minimum_payment,
        noInterest: card.no_interest_payment,
        full: card.current_balance,
    };
}
