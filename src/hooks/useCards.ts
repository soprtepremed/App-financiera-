/**
 * useCards - React Query hooks para tarjetas de crédito
 * CRUD completo con Supabase + invalidación de caché
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import type { CreditCard } from '../types/database';

// ── Tipos para formularios ──

export interface CardFormData {
    bank_name: string;
    card_alias: string;
    last_four_digits: string;
    credit_limit: number;
    current_balance: number;
    cut_off_day: number;
    payment_due_day: number;
    annual_interest_rate?: number;  // Opcional — el usuario no siempre lo sabe
    card_color?: string;
}

// ── Keys de caché ──

const CARDS_KEY = ['cards'] as const;
const cardDetailKey = (id: string) => ['cards', id] as const;

// ── Queries ──

/** Obtiene todas las tarjetas del usuario actual */
export function useCards() {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: CARDS_KEY,
        queryFn: async (): Promise<CreditCard[]> => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('credit_cards')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('bank_name', { ascending: true });

            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });
}

/** Obtiene una tarjeta por ID */
export function useCard(cardId: string) {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: cardDetailKey(cardId),
        queryFn: async (): Promise<CreditCard | null> => {
            if (!user) return null;

            const { data, error } = await supabase
                .from('credit_cards')
                .select('*')
                .eq('id', cardId)
                .eq('user_id', user.id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!user && !!cardId,
    });
}

// ── Mutations ──

/** Crear una nueva tarjeta */
export function useCreateCard() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (formData: CardFormData) => {
            if (!user) throw new Error('No autenticado');

            const { data, error } = await supabase
                .from('credit_cards')
                .insert({
                    user_id: user.id,
                    ...formData,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            // Invalida la lista para que se re-fetche
            queryClient.invalidateQueries({ queryKey: CARDS_KEY });
        },
    });
}

/** Actualizar una tarjeta existente */
export function useUpdateCard() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<CardFormData> & { id: string }) => {
            if (!user) throw new Error('No autenticado');

            const { data, error } = await supabase
                .from('credit_cards')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: CARDS_KEY });
            queryClient.invalidateQueries({ queryKey: cardDetailKey(data.id) });
        },
    });
}

/** Soft-delete: desactiva la tarjeta */
export function useDeleteCard() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (cardId: string) => {
            if (!user) throw new Error('No autenticado');

            const { error } = await supabase
                .from('credit_cards')
                .update({ is_active: false })
                .eq('id', cardId)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CARDS_KEY });
        },
    });
}

// ── Helpers ──

/**
 * Calcula los días restantes hasta el pago o corte.
 * @returns número de días (negativo si ya pasó)
 */
export function getDaysUntil(dayOfMonth: number): number {
    if (!dayOfMonth || dayOfMonth < 1) return 99;
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let targetDate = new Date(currentYear, currentMonth, dayOfMonth);

    // Si ya pasó este mes, calcular para el siguiente
    if (currentDay > dayOfMonth) {
        targetDate = new Date(currentYear, currentMonth + 1, dayOfMonth);
    }

    const diffMs = targetDate.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determina el estado de urgencia de una tarjeta
 * basado en los días hasta el pago y el porcentaje de uso.
 */
export function getCardStatus(card: CreditCard): 'safe' | 'warning' | 'danger' {
    const daysToPayment = getDaysUntil(card.payment_due_day);
    const usagePercent = card.credit_limit > 0 ? card.current_balance / card.credit_limit : 0;

    if (daysToPayment <= 3 && card.current_balance > 0) return 'danger';
    if (daysToPayment <= 7 || usagePercent > 0.7) return 'warning';
    return 'safe';
}
