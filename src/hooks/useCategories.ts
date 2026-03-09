/**
 * useCategories - React Query hook para categorías de gasto
 * Obtiene categorías globales predefinidas + custom del usuario
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import type { ExpenseCategory } from '../types/database';

// ── Keys ──
const CATEGORIES_KEY = ['categories'] as const;

/**
 * Obtiene todas las categorías disponibles para el usuario.
 * Incluye las 14 categorías globales (user_id IS NULL)
 * más cualquier categoría custom creada por el usuario.
 */
export function useCategories() {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: CATEGORIES_KEY,
        queryFn: async (): Promise<ExpenseCategory[]> => {
            // RLS ya filtra: globales (user_id IS NULL) + del usuario
            const { data, error } = await supabase
                .from('expense_categories')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;
            return data ?? [];
        },
        enabled: !!user,
        // Categorías cambian poco, cache largo
        staleTime: 1000 * 60 * 30,
    });
}

/**
 * Mapa de nombres de Ionicons para cada categoría predefinida.
 * Mapea el emoji de la DB a un ícono vectorial moderno.
 */
export const CATEGORY_ICONS: Record<string, string> = {
    '🏠': 'home-outline',
    '🍔': 'fast-food-outline',
    '🚗': 'car-outline',
    '🎮': 'game-controller-outline',
    '📱': 'phone-portrait-outline',
    '💊': 'medkit-outline',
    '📚': 'book-outline',
    '👕': 'shirt-outline',
    '💡': 'bulb-outline',
    '🛒': 'cart-outline',
    '🐾': 'paw-outline',
    '🎁': 'gift-outline',
    '💰': 'wallet-outline',
    '📦': 'cube-outline',
};

/**
 * Devuelve el nombre de Ionicons para una categoría.
 * Fallback a 'pricetag-outline' si no hay mapeo.
 */
export function getCategoryIconName(emoji: string): string {
    return CATEGORY_ICONS[emoji] ?? 'pricetag-outline';
}
