/**
 * useBudget - Hooks para presupuesto e ingresos
 * Maneja fuentes de ingreso y distribución del presupuesto
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

// ── Tipos ──

export interface IncomeSource {
    id: string;
    user_id: string;
    source_name: string;
    amount: number;
    frequency: 'weekly' | 'biweekly' | 'monthly';
    is_active: boolean;
    created_at: string;
}

export interface IncomeFormData {
    source_name: string;
    amount: number;
    frequency: 'weekly' | 'biweekly' | 'monthly';
}

export interface BudgetSummary {
    totalIncome: number;
    totalExpenses: number;
    totalCardPayments: number;
    totalSavings: number;
    available: number;
}

// ── Keys ──

const INCOME_KEY = ['income'] as const;
const BUDGET_KEY = ['budget', 'summary'] as const;

// ── Queries ──

/** Obtiene todas las fuentes de ingreso activas */
export function useIncomeSources() {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: INCOME_KEY,
        queryFn: async (): Promise<IncomeSource[]> => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('income_sources')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('amount', { ascending: false });

            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 10, // 10 min
    });
}

/** Calcula el resumen de presupuesto del mes actual */
export function useBudgetSummary() {
    const { user } = useAuthStore();
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    return useQuery({
        queryKey: BUDGET_KEY,
        queryFn: async (): Promise<BudgetSummary> => {
            if (!user) {
                return { totalIncome: 0, totalExpenses: 0, totalCardPayments: 0, totalSavings: 0, available: 0 };
            }

            // Obtener ingresos
            const { data: incomes } = await supabase
                .from('income_sources')
                .select('amount, frequency')
                .eq('user_id', user.id)
                .eq('is_active', true);

            // Calcular ingreso mensual total
            const totalIncome = (incomes ?? []).reduce((sum, inc) => {
                switch (inc.frequency) {
                    case 'weekly': return sum + inc.amount * 4;
                    case 'biweekly': return sum + inc.amount * 2;
                    case 'monthly': return sum + inc.amount;
                    default: return sum + inc.amount;
                }
            }, 0);

            // Obtener gastos del mes
            const { data: expenses } = await supabase
                .from('expenses')
                .select('amount')
                .eq('user_id', user.id)
                .gte('expense_date', startDate)
                .lte('expense_date', endDate);

            const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + e.amount, 0);

            // Obtener balances de tarjetas (lo que hay que pagar)
            const { data: cards } = await supabase
                .from('credit_cards')
                .select('current_balance')
                .eq('user_id', user.id)
                .eq('is_active', true);

            const totalCardPayments = (cards ?? []).reduce((sum, c) => sum + c.current_balance, 0);

            // Obtener metas de ahorro activas
            const { data: goals } = await supabase
                .from('savings_goals')
                .select('monthly_contribution')
                .eq('user_id', user.id)
                .eq('is_active', true);

            const totalSavings = (goals ?? []).reduce((sum, g) => sum + (g.monthly_contribution ?? 0), 0);

            const available = totalIncome - totalExpenses - totalSavings;

            return { totalIncome, totalExpenses, totalCardPayments, totalSavings, available };
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5,
    });
}

// ── Mutations ──

/** Crear fuente de ingreso */
export function useCreateIncome() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (formData: IncomeFormData) => {
            if (!user) throw new Error('No autenticado');

            const { data, error } = await supabase
                .from('income_sources')
                .insert({ user_id: user.id, ...formData })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INCOME_KEY });
            queryClient.invalidateQueries({ queryKey: BUDGET_KEY });
        },
    });
}

/** Eliminar fuente de ingreso (soft delete) */
export function useDeleteIncome() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (incomeId: string) => {
            if (!user) throw new Error('No autenticado');

            const { error } = await supabase
                .from('income_sources')
                .update({ is_active: false })
                .eq('id', incomeId)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INCOME_KEY });
            queryClient.invalidateQueries({ queryKey: BUDGET_KEY });
        },
    });
}
