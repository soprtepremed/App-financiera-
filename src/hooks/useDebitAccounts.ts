/**
 * useDebitAccounts - React Query hooks para cuentas de débito/ahorro
 * CRUD completo: listar, crear, actualizar saldo, eliminar
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

// ── Tipos ──

/** Registro de cuenta de débito tal como viene de la DB */
export interface DebitAccount {
    id: string;
    user_id: string;
    bank_name: string;
    account_alias: string | null;
    last_four_digits: string;
    account_type: 'debit' | 'savings' | 'investment';
    current_balance: number;
    account_color: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** Datos para crear/editar una cuenta de débito */
export interface DebitAccountFormData {
    bank_name: string;
    account_alias: string;
    last_four_digits: string;
    account_type: 'debit' | 'savings' | 'investment';
    current_balance: number;
    account_color?: string;
}

// ── Keys de caché ──
const DEBIT_ACCOUNTS_KEY = ['debit_accounts'] as const;

// ── Queries ──

/** Obtiene todas las cuentas de débito/ahorro activas del usuario */
export function useDebitAccounts() {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: DEBIT_ACCOUNTS_KEY,
        queryFn: async (): Promise<DebitAccount[]> => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('debit_accounts')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('bank_name', { ascending: true });

            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5,
    });
}

// ── Mutations ──

/** Crear una nueva cuenta de débito */
export function useCreateDebitAccount() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (formData: DebitAccountFormData) => {
            if (!user) throw new Error('No autenticado');

            const { data, error } = await supabase
                .from('debit_accounts')
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
            queryClient.invalidateQueries({ queryKey: DEBIT_ACCOUNTS_KEY });
        },
    });
}

/** Actualizar una cuenta de débito (saldo, alias, etc.) */
export function useUpdateDebitAccount() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<DebitAccountFormData> & { id: string }) => {
            if (!user) throw new Error('No autenticado');

            const { data, error } = await supabase
                .from('debit_accounts')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DEBIT_ACCOUNTS_KEY });
        },
    });
}

/** Soft-delete: desactivar cuenta */
export function useDeleteDebitAccount() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (accountId: string) => {
            if (!user) throw new Error('No autenticado');

            const { error } = await supabase
                .from('debit_accounts')
                .update({ is_active: false })
                .eq('id', accountId)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DEBIT_ACCOUNTS_KEY });
        },
    });
}
