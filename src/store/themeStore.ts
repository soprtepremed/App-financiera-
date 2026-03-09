/**
 * themeStore - Estado global del tema de la aplicación
 * Persiste la preferencia dark/light usando expo-secure-store
 * para que sobreviva reinicios de la app.
 */
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const THEME_KEY = 'finanzapp_theme';

interface ThemeState {
    isDark: boolean;
    /** Carga la preferencia guardada (llamar al inicio de la app) */
    loadTheme: () => Promise<void>;
    /** Alterna entre modo oscuro y claro, y persiste la preferencia */
    toggle: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
    // Valor por defecto: modo oscuro (el diseño principal es dark)
    isDark: true,

    /**
     * Lee la preferencia guardada en SecureStore.
     * Debe llamarse una vez al iniciar la app (en _layout.tsx).
     */
    loadTheme: async () => {
        try {
            const saved = await SecureStore.getItemAsync(THEME_KEY);
            if (saved !== null) {
                set({ isDark: saved === 'dark' });
            }
        } catch {
            // Si falla la lectura, mantiene el valor por defecto
        }
    },

    /**
     * Alterna el tema y guarda la nueva preferencia en SecureStore.
     */
    toggle: async () => {
        const newIsDark = !get().isDark;
        set({ isDark: newIsDark });
        try {
            await SecureStore.setItemAsync(THEME_KEY, newIsDark ? 'dark' : 'light');
        } catch {
            // Si falla el guardado, la UI ya cambió — no es crítico
        }
    },
}));
