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

            // Sanitizar card_id: '' → null (FK requiere UUID o NULL)
            const cleanData = {
                ...formData,
                card_id: formData.card_id || null,
            };

            const { data, error } = await supabase
                .from('expenses')
                .insert({
                    user_id: user.id,
                    ...cleanData,
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

// ── Hooks extendidos para pantalla de Gastos ──

/**
 * Obtiene TODOS los gastos del mes actual con categorías expandidas.
 * Incluye la relación con expense_categories para mostrar nombre/icono.
 */
export function useAllMonthExpenses() {
    const { user } = useAuthStore();
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    return useQuery({
        queryKey: ['expenses', 'all-month', now.getMonth(), now.getFullYear()],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('expenses')
                .select('*, expense_categories(name, icon, color), credit_cards(bank_name, card_alias, last_four_digits)')
                .eq('user_id', user.id)
                .gte('expense_date', startDate)
                .lte('expense_date', endDate)
                .order('expense_date', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 2,
    });
}

/** Resumen semanal: esta semana vs pasada, promedio diario */
export interface WeeklySummaryData {
    thisWeek: number;
    lastWeek: number;
    dailyAvg: number;
    trend: 'up' | 'down' | 'equal';
    thisWeekCount: number;
    daysElapsed: number;
}

export function useWeeklySummary(): WeeklySummaryData {
    const { data: expenses = [] } = useAllMonthExpenses();
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Dom, 1=Lun...

    // Inicio de esta semana (lunes)
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    thisWeekStart.setHours(0, 0, 0, 0);

    // Inicio de la semana pasada
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setMilliseconds(-1);

    let thisWeek = 0;
    let lastWeek = 0;
    let thisWeekCount = 0;

    for (const exp of expenses) {
        const d = new Date(exp.expense_date + 'T12:00:00');
        if (d >= thisWeekStart) {
            thisWeek += (exp as any).amount ?? 0;
            thisWeekCount++;
        } else if (d >= lastWeekStart && d <= lastWeekEnd) {
            lastWeek += (exp as any).amount ?? 0;
        }
    }

    const daysElapsed = Math.max(1, dayOfWeek === 0 ? 7 : dayOfWeek);
    const dailyAvg = thisWeek / daysElapsed;
    const trend = thisWeek > lastWeek ? 'up' : thisWeek < lastWeek ? 'down' : 'equal';

    return { thisWeek, lastWeek, dailyAvg, trend, thisWeekCount, daysElapsed };
}

/** Análisis de gastos recurrentes con proyección mensual */
export interface RecurringItem {
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    totalAmount: number;
    occurrences: number;
    avgPerOccurrence: number;
    monthlyProjection: number;
}

export function useRecurringAnalysis(): RecurringItem[] {
    const { data: expenses = [] } = useAllMonthExpenses();

    // Agrupar gastos recurrentes por categoría
    const grouped: Record<string, {
        name: string; icon: string; color: string;
        total: number; count: number;
    }> = {};

    for (const exp of expenses) {
        if (!(exp as any).is_recurring) continue;
        const cat = (exp as any).expense_categories;
        const catId = (exp as any).category_id ?? 'other';
        if (!grouped[catId]) {
            grouped[catId] = {
                name: cat?.name ?? 'Otros',
                icon: cat?.icon ?? '📦',
                color: cat?.color ?? '#6366F1',
                total: 0,
                count: 0,
            };
        }
        grouped[catId].total += (exp as any).amount ?? 0;
        grouped[catId].count += 1;
    }

    // Calcular proyección: si hay N ocurrencias en los días que van del mes,
    // proyectar a 30 días
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysSoFar = Math.max(1, now.getDate());

    return Object.values(grouped)
        .map(g => ({
            categoryName: g.name,
            categoryIcon: g.icon,
            categoryColor: g.color,
            totalAmount: g.total,
            occurrences: g.count,
            avgPerOccurrence: g.total / Math.max(1, g.count),
            monthlyProjection: (g.total / daysSoFar) * daysInMonth,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);
}
