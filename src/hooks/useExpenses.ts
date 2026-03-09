/**
 * useExpenses - React Query hooks para gastos
 * CRUD con filtros por mes, tarjeta y categoría
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import type { Expense } from '../types/database';

// ── Tipos ──

export interface ExpenseFormData {
    card_id: string | null;
    category_id?: string;
    description: string;
    amount: number;
    expense_date: string;
    is_recurring: boolean;
    is_msi: boolean;
    msi_months?: number;
    notes?: string;
}

export interface ExpenseFilters {
    cardId?: string;
    categoryId?: string;
    month?: number; // 0-11
    year?: number;
}

// ── Keys ──

const EXPENSES_KEY = ['expenses'] as const;
const expensesFilteredKey = (filters: ExpenseFilters) => ['expenses', filters] as const;

// ── Queries ──

/** Obtiene gastos con filtros opcionales */
export function useExpenses(filters: ExpenseFilters = {}) {
    const { user } = useAuthStore();
    const now = new Date();
    const month = filters.month ?? now.getMonth();
    const year = filters.year ?? now.getFullYear();

    // Calcular rango de fechas del mes
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    return useQuery({
        queryKey: expensesFilteredKey(filters),
        queryFn: async (): Promise<Expense[]> => {
            if (!user) return [];

            let query = supabase
                .from('expenses')
                .select('*, credit_cards(bank_name, card_alias, last_four_digits)')
                .eq('user_id', user.id)
                .gte('expense_date', startDate)
                .lte('expense_date', endDate)
                .order('expense_date', { ascending: false });

            if (filters.cardId) {
                query = query.eq('card_id', filters.cardId);
            }
            if (filters.categoryId) {
                query = query.eq('category_id', filters.categoryId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 2, // 2 min cache
    });
}

/** Obtiene el resumen de gastos del mes indicado (por defecto: mes actual) */
export function useMonthSummary(month?: number, year?: number) {
    const { user } = useAuthStore();
    const now = new Date();
    const m = month ?? now.getMonth();
    const y = year ?? now.getFullYear();
    const startDate = new Date(y, m, 1).toISOString().split('T')[0];
    const endDate = new Date(y, m + 1, 0).toISOString().split('T')[0];

    return useQuery({
        queryKey: ['expenses', 'summary', m, y],
        queryFn: async () => {
            if (!user) return { total: 0, count: 0, byCategory: {} };

            const { data, error } = await supabase
                .from('expenses')
                .select('amount, category_id')
                .eq('user_id', user.id)
                .gte('expense_date', startDate)
                .lte('expense_date', endDate);

            if (error) throw error;

            const total = (data ?? []).reduce((sum, e) => sum + e.amount, 0);
            const byCategory: Record<string, number> = {};

            for (const expense of data ?? []) {
                const catId = expense.category_id ?? 'sin_categoria';
                byCategory[catId] = (byCategory[catId] ?? 0) + expense.amount;
            }

            return { total, count: data?.length ?? 0, byCategory };
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 2,
    });
}

// ── Mutations ──

/** Registrar un nuevo gasto */
export function useCreateExpense() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (formData: ExpenseFormData) => {
            if (!user) throw new Error('No autenticado');

            const { data, error } = await supabase
                .from('expenses')
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
            // Invalida gastos Y tarjetas (balance pudo cambiar)
            queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
            queryClient.invalidateQueries({ queryKey: ['cards'] });
        },
    });
}

/** Eliminar un gasto */
export function useDeleteExpense() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (expenseId: string) => {
            if (!user) throw new Error('No autenticado');

            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', expenseId)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
            queryClient.invalidateQueries({ queryKey: ['cards'] });
        },
    });
}
