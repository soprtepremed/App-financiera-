/**
 * Cliente de Supabase - FinanzApp
 * Las credenciales se leen de variables de entorno (EXPO_PUBLIC_*).
 * NINGUNA clave sensible se hardcodea en el código fuente.
 *
 * Seguridad:
 * - EXPO_PUBLIC_SUPABASE_ANON_KEY es segura de exponer en cliente:
 *   está diseñada para ser pública y está protegida por RLS policies.
 * - La Service Role Key NUNCA debe usarse en el cliente.
 * - La contraseña de DB NUNCA debe estar en el cliente.
 */
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ── Leer credenciales de variables de entorno ──
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Verificación en tiempo de desarrollo
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
        '❌ Faltan variables de entorno de Supabase.\n' +
        'Copia .env.example a .env y configura:\n' +
        '  EXPO_PUBLIC_SUPABASE_URL\n' +
        '  EXPO_PUBLIC_SUPABASE_ANON_KEY'
    );
}

/**
 * Adaptador de almacenamiento seguro para Supabase Auth.
 * Usa expo-secure-store en móvil (encriptado) y localStorage en web.
 */
/**
 * Guard SSR: localStorage no existe en Node.js durante el build estático.
 * Retorna null silenciosamente si no está disponible.
 */
const isLocalStorageAvailable = typeof localStorage !== 'undefined';

const SecureStoreAdapter = {
    getItem: async (key: string): Promise<string | null> => {
        if (Platform.OS === 'web') {
            return isLocalStorageAvailable ? localStorage.getItem(key) : null;
        }
        return SecureStore.getItemAsync(key);
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (Platform.OS === 'web') {
            if (isLocalStorageAvailable) localStorage.setItem(key, value);
            return;
        }
        await SecureStore.setItemAsync(key, value);
    },
    removeItem: async (key: string): Promise<void> => {
        if (Platform.OS === 'web') {
            if (isLocalStorageAvailable) localStorage.removeItem(key);
            return;
        }
        await SecureStore.deleteItemAsync(key);
    },
};

/**
 * Cliente singleton de Supabase.
 * - Tokens almacenados en SecureStore (encriptado en móvil)
 * - Auto-refresca la sesión
 * - Detecta sesión desde URL solo en web (para OAuth redirect)
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: SecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
    },
});

export { SUPABASE_URL };
